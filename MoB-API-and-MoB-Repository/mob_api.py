from flask import Flask, jsonify, request, abort, session, url_for, render_template, flash, redirect, send_from_directory
from flask_cors import CORS
from flask_mail import Mail, Message
from queue import Queue
from bs4 import BeautifulSoup
import threading
import math
import random
import string
import hashlib
import os
import json
import psycopg2
import psycopg2.extras
import datetime
import subprocess

# connecting to the data base(error = psycopg2.DatabaseError)
try:
    conn = psycopg2.connect(dbname='db_name', user='postgres_user', password='mypassword', port='5432')
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    print ("A connection has been stablished with the database")
except:
    print ("It was not possible to connect with the database")

app = Flask(__name__)


app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'myemail@gmail.com'
app.config['MAIL_PASSWORD'] = 'password'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True


CORS(app)
mail = Mail(app)
api_url = 'https://mob.ciens.ucv.ve/'
mobEnvURL = '/route-to-warcs-files/'  # route where you want to save the WARCS files.
hash_key = 'mykey' # secret key to hash

# # # # # # #  # # # # # # #  # # #   WORKER FUNCTIONS | CONTROL  # # # # # # # #  # # # # # # #  # # #
# # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #
# Here's the functions for the Daemon worker that will be scoring all new segmentations asyncroniusly. 

def new_best_seg(id,gran):
    # "id" of the web page, creates or updates the best segmentation by taking the most shared blocks/tags on all segmentations.
    try:

        # search for previous best segmentation.
        cur.execute("SELECT id_details FROM mob_segmentation_details WHERE mob_status = %s AND id_web_page =%s AND mob_gran =%s", ('best',id,gran))


        if cur.rowcount > 0:  # deletes previous best seg.
            p_best = cur.fetchone()
            db_ddetails(p_best['id_details'])

 # --------- Gathering the data
        # getting the number of segmentations
        cur.execute("""SELECT count(d.id_details) as cont
                        FROM mob_segmentation_details as d 
                        WHERE mob_status = %s AND id_web_page =%s AND mob_gran =%s  """
                    , ('scored',id,gran))

        num = cur.fetchone()
        num = num['cont']

        # getting geo score. 
        cur.execute("""SELECT g.identifier, count(d.id_details) as score
                        FROM mob_segmentation_details as d 
                        INNER JOIN mob_segmentation_geo as g ON g.id_details = d.id_details
                        WHERE mob_status = %s AND id_web_page =%s AND mob_gran =%s 
                        GROUP BY g.identifier
                        ORDER BY g.identifier, score DESC """
                    , ('scored',id,gran))

        score_geo = cur.fetchall()

        # getting sem score.  
        cur.execute("""SELECT g.identifier , g.tag, count(d.id_details) as score
                        FROM mob_segmentation_details as d 
                        INNER JOIN mob_segmentation_geo as g ON g.id_details = d.id_details
                        WHERE mob_status = %s AND id_web_page =%s AND mob_gran =%s 
                        GROUP BY g.identifier, g.tag
                        ORDER BY g.identifier, score DESC, g.tag """
                    , ('scored',id,gran))

        score_sem = cur.fetchall()
 # --------- Analizing Data and filling Best Seg Struct
        blockT = {}
        blockT['block'] = []
        blockT['meta'] = {}
        blockT['meta']['cantblock'] = 0
        blockT['meta']['areablock'] = 0

        for geo_b in score_geo:

            if geo_b['score'] >= num: # it gets added to the best segmentation

                for sem_b in score_sem: #searching for the best tag

                    if sem_b['identifier'] == geo_b['identifier']:

                        cur.execute(""" SELECT g.identifier as id, g.tag, ST_XMin(g.block) as left, ST_YMin(g.block) as top, ST_XMax(g.block) - ST_XMin(g.block) as width, ST_YMax(g.block) - ST_YMin(g.block) as height, g.words, g.elems, g.dom, g.gran
                                    FROM mob_segmentation_geo as g
                                    INNER JOIN mob_segmentation_details as d ON d.id_details = g.id_details  
                                    WHERE g.identifier = %s AND g.tag = %s AND d.mob_gran = %s AND d.id_web_page = %s AND d.mob_status = %s
                                    LIMIT 1""", 
                                    (geo_b['identifier'], sem_b['tag'], gran, id, 'scored')) 
                                    

                        blockaux = cur.fetchone()

                        blockT['meta']['cantblock'] = blockT['meta']['cantblock'] + 1
                        blockT['meta']['areablock'] = blockT['meta']['areablock'] + (blockaux['width'] * blockaux['height'])
                        blockT['block'].append({'id':'MobBlockId'+ str(blockaux['id']),'identifier':blockaux['id'], 'tag':blockaux['tag'], 'left':blockaux['left'], 'top':blockaux['top'], 'width':blockaux['width'], 'height':blockaux['height'], 'words':blockaux['words'], 'elems':blockaux['elems'], 'dom': blockaux['dom'], 'gran':blockaux['gran']})
                        break

 # --------- Creating Best Seg on DB

        cur.execute("SELECT id_user FROM general_users WHERE username = %s",('mob',))
        id_user = cur.fetchone()[0]
        cur.execute("INSERT INTO mob_segmentation_details (id_web_page, mob_gran, seg_type, mob_status, mob_date, mob_blocks, id_user) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id_details", (id, gran, 'mob', 'best', str(datetime.datetime.now()), json.dumps(blockT), id_user))
        conn.commit()
        best_seg = cur.fetchone()
        best_seg = best_seg['id_details']
        # creating the blocks of the best segmentation
        for b in blockT['block']:
            geo_block = 'LINESTRING('+str(b['left'])+' '+str(b['top'])+', '+str(b['left']+b['width'])+' '+str(b['top'])+', '+str(b['left']+b['width'])+' '+str(b['top']+b['height'])+', '+str(b['left'])+' '+str(b['top']+b['height'])+', '+str(b['left'])+' '+str(b['top'])+')'
            cur.execute("INSERT INTO mob_segmentation_geo (id_details, tag, block, block_id, identifier, words, elems, dom, gran ) VALUES (%s,%s,ST_GeomFromText(%s),%s,%s,%s,%s,%s, %s)", (best_seg,b['tag'],geo_block,b['id'],b['identifier'], b['words'], b['elems'],json.dumps(b['dom']), b['gran']))
        conn.commit()
 # --------- Updating scores 
        for geo_b in score_geo:
            for sem_b in score_sem:
                if sem_b['identifier'] == geo_b['identifier']:
                    cur.execute("""
                                    UPDATE mob_segmentation_geo AS g
                                    SET score_geo = %s, score_sem = %s 
                                    FROM mob_segmentation_details AS d 
                                    WHERE d.id_details = g.id_details AND d.mob_gran = %s AND d.id_web_page = %s AND (d.mob_status = 'scored' OR d.mob_status = 'best' ) AND g.identifier = %s AND g.tag = %s  """,
                                    (geo_b['score'], sem_b['score'], gran, id, sem_b['identifier'],sem_b['tag']))
        conn.commit()

        cur.execute(""" WITH t AS (
                          SELECT t1.id_details AS rowid, sum(t1.score_sem) + sum(t1.score_geo) AS score
                          FROM mob_segmentation_geo AS t1
                          INNER JOIN mob_segmentation_details AS t2 ON t2.id_details = t1.id_details
                          WHERE (t2.mob_status='scored' OR t2.mob_status ='best') AND t2.mob_gran = %s AND t2.id_web_page = %s
                          GROUP BY rowid
                          )
                        UPDATE mob_segmentation_details
                        SET mob_score = t.score
                        FROM t
                        WHERE id_details = t.rowid """, (gran,id))
               
        conn.commit()

    except Exception as e:
        conn.rollback()
        print ("error in new_best_seg: "+ str(e))
    except:
        conn.rollback()

def identify_seg(op, id):
    # (Id = details id) Compares and Identify the blocks on a segmentation. 
    try:
        if op == 0:  #first time 
            # Identify blocks.
            cur.execute("SELECT id_geo FROM mob_segmentation_geo WHERE id_details = %s", (id,))
            if cur.rowcount > 0:
                b_ids = cur.fetchall()
                cont = 1

                for b in b_ids: # Update identifiers
                    cur.execute("UPDATE mob_segmentation_geo SET identifier = %s WHERE id_geo = %s ", (cont,b['id_geo']))
                    cont = cont + 1
                conn.commit()

                cur.execute("UPDATE mob_segmentation_details SET mob_status = %s WHERE id_details = %s RETURNING id_web_page, mob_gran", ('scored', id))
                conn.commit()
                info = cur.fetchone()
                print("identification completed for: "+ str(id))
                new_best_seg(info['id_web_page'],info['mob_gran'])

            else:
                print("no blocks found for segmentation: " + str(id))

        else: 
            # Identify blocks.
            cur.execute("SELECT id_web_page, mob_gran FROM mob_segmentation_details WHERE id_details = %s", (id,))
            pinfo = cur.fetchone()

            # Running a match of all the new blocks with the Ground Truth to validate the HausdorffDistance between the blocks 
            cur.execute(""" SELECT DISTINCT ON(g2.id_geo) ST_HausdorffDistance(g2.block,g.block) as dist, g2.id_geo as id, g.id_geo, g.identifier 
                            FROM mob_segmentation_geo AS g 
                            INNER JOIN mob_segmentation_details AS d ON d.id_details = g.id_details
                            INNER JOIN mob_segmentation_geo AS g2 ON g.id_details <> g2.id_details
                            WHERE g2.id_details = %s AND d.mob_status = 'scored' AND d.mob_gran=%s AND d.id_web_page = %s AND ST_HausdorffDistance(g2.block,g.block) < 30
                            ORDER BY g2.id_geo, dist, g.id_geo""",
                            (id,pinfo['mob_gran'],pinfo['id_web_page']) )

            if cur.rowcount > 0:
                new_ids = cur.fetchall()
                # Update the respectives identifiers
                for b in new_ids:
                    cur.execute("UPDATE mob_segmentation_geo SET identifier = %s WHERE id_geo = %s",(b['identifier'], b['id']))
                conn.commit()

            # Search for any block which was not identified yet to create a new identifier for them.
            cur.execute("SELECT id_geo as id FROM mob_segmentation_geo WHERE id_details = %s AND identifier is null", (id,))
            
            if cur.rowcount > 0:
                b_ids = cur.fetchall()
                # getting the max identifier
                cur.execute("""SELECT g.identifier
                                FROM mob_segmentation_geo AS g
                                INNER JOIN mob_segmentation_details AS d ON d.id_details = g.id_details
                                WHERE d.mob_status =%s AND d.id_web_page =%s AND d.mob_gran =%s  
                                ORDER BY g.identifier DESC
                                LIMIT 1"""
                            , ('scored',pinfo['id_web_page'],pinfo['mob_gran']))

                cont = cur.fetchone()[0]

                for b in b_ids:
                    cont = cont + 1
                    cur.execute("UPDATE mob_segmentation_geo SET identifier = %s WHERE id_geo = %s",(cont, b['id']))
                conn.commit()

            cur.execute("UPDATE mob_segmentation_details SET mob_status = %s WHERE id_details = %s", ('scored', id))
            conn.commit()
            print("identification completed for: "+ str(id))
            new_best_seg(pinfo['id_web_page'],pinfo['mob_gran'])


    except Exception as e:
        conn.rollback()
        print ("error in identifying: "+ str(e))
    except:
        conn.rollback()

def update_best_seg(id):
    # updates the scores of all segmentations.  op (first or not)  seg (new segmentation id). Return the segmentation id.
    try:
        cur.execute("SELECT id_web_page, mob_gran, seg_type FROM mob_segmentation_details WHERE id_details = %s",(id,))
        page = cur.fetchone()
        cur.execute("SELECT id_details FROM mob_segmentation_details WHERE id_web_page = %s AND seg_type =%s AND mob_gran=%s AND mob_status =%s ",(page['id_web_page'], 'mob', page['mob_gran'], 'scored'))

        if page['seg_type'] == 'mob':
            identify_seg (cur.rowcount,id)

    except:
        conn.rollback()

def download_warc_page(id,url):
    # downloads and creates the WARC format for a given url 
    subprocess.run('wget --no-check-certificate --warc-file='+mobEnvURL+str(id)+' --recursive --level=1 -O tempfile '+url, shell=True)

def worker_func(queue):
    #worker function to update segmentation score safely. OP=1 : segmentation scoring. else: Download WARC
    while True:
        obj = queue.get()
        if obj['op'] == 1:
            update_best_seg (obj['id'])
            print ("score updated successfully on seg: " + str(obj['id']))
        else :
            page_id = download_warc_page (obj['id'], obj['url'])
            print ("WARC downloaded/created successfully for page: " + str(obj['id']))
        queue.task_done()


# -------------   Creating a global queue for the worker.
seg_queue = Queue(maxsize = 0)

# ------------  Initializing the thread worker.
seg_worker = threading.Thread(target=worker_func, args=(seg_queue,))
seg_worker.daemon = True
seg_worker.start()

# # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #
# # # # # # #  # # # # # # #  # # # # # # #  API SERVICES # # # # # # # #  # # # # # # #  # # # # # # # 
# # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #

# # # # # # # # USER SERVICES # # # # # # # # 

@app.route('/api/users',methods=['POST','DELETE','PUT'])
@app.route('/api/users/<string:username>',methods=['GET'])
def api_users(username=None):

    if request.method == 'POST': # C-reates a new user 

        try:
            error_msg = ""
            data = request.get_json()
            username = data['username'].lower()
            email = data['email'].lower()
            cur.execute("SELECT * FROM general_users WHERE username=%s OR email=%s" , (username,email))
        
            if not cur.fetchone(): # The user is created
                num = os.urandom(10)
                secret_hash = hashlib.md5(num).hexdigest() # create secret key for activation
                coded_pass = hashlib.md5((data['password'] + hash_key).encode('utf-8')).hexdigest() # encode the pass
                cur.execute("INSERT INTO general_users (username,password,email) VALUES (%s,%s,%s) RETURNING id_user" , 
                            (username,coded_pass,email) )
                conn.commit()
                id_user = cur.fetchone()
                cur.execute("INSERT INTO general_users_activation (id_user,hash) VALUES (%s, %s) RETURNING id_activation", (id_user["id_user"], secret_hash))
                conn.commit()
                id_activation = cur.fetchone()
                mobmail("Welcome to MoB "+username+"!", email, "Click on the button below to activate your account!.", "Activate!", api_url+"mobactivate/"+ str(id_activation['id_activation']) +"/"+ secret_hash)
                return json.dumps({'code':200, 'msg':'The user has been registered succesfully'})
            else:
                error_msg = "the username or email are already in use"
                raise

        except Exception as e:
            conn.rollback()
            return json.dumps({'code':400, 'msg': error_msg + " " + str(e)})
        except:
            conn.rollback()

    elif request.method == 'GET': #R-ead user's info
        try:
            cur.execute("SELECT * FROM general_users WHERE username=%s" , (username,))
            row = cur.fetchone()
            user = {
                'username': row['username'],
                'name': row['name'],
                'lastname': row['lastname'],
                'email': row['email']
                }
            return json.dumps(user)
            
        except Exception as e:
            conn.rollback()
            return json.dumps({'code':400, 'msg':"error getting user's info" + " " + str(e)})
        except:
            conn.rollback()

    elif request.method == 'PUT': #U-pdates user's info [test]
        try:
            error_msg = ""
            user_id = session.get('user_id', None)
            if user_id is not None:

                cur.execute("SELECT username, email, password FROM general_users WHERE id_user = %s", (user_id,))
                user = cur.fetchone()

                change_email = False
                data = request.get_json()
                print(data)
                new_username = data['username'].lower()
                new_email = data['email'].lower()

                if new_username != user['username']:
                    # checks for username availability 
                    cur.execute("SELECT username FROM general_users WHERE username = %s", (new_username,))
                    username_test = cur.fetchone()
                    if username_test is not None:
                        error_msg = "That username already exists"
                        raise

                if new_email != user['email']:
                    # checks for email availability 
                    cur.execute("SELECT email FROM general_users WHERE email = %s", (new_email,))
                    email_test = cur.fetchone()
                    if email_test is not None:
                        error_msg = "That email already exists"
                        raise
                    change_email = True

                if isNotEmpty(data['new_pass']):
                    # it's changing their password.
                    coded_pass = hashlib.md5((data['new_pass'] + hash_key).encode('utf-8')).hexdigest() # encode the pass
                else:
                    coded_pass = user['password']

                if change_email:
                    active = 0
                else:
                    active = 1

                cur.execute("UPDATE general_users SET username=%s, name=%s, lastname=%s, email=%s, active=%s, password=%s WHERE id_user=%s" , 
                            (new_username,data['name'],data['lastname'],new_email,active,coded_pass,user_id))
                conn.commit()

                if change_email:
                    num = os.urandom(10)
                    secret_hash = hashlib.md5(num).hexdigest() # create secret key for activation
                    cur.execute("INSERT INTO general_users_activation (id_user,hash) VALUES (%s, %s) RETURNING id_activation", (user_id, secret_hash))
                    conn.commit()
                    id_activation = cur.fetchone()
                    mobmail("Successful email change for "+new_username, new_email, "Click on the button below to re-activate your account!.", "Re-activate!", api_url+"mobactivate/"+ str(id_activation['id_activation']) +"/"+ secret_hash)
                    logout()
                    return json.dumps({'code':200, 'msg':'Your email has been changed, please re-activate it', 'reactivate':1})

                return json.dumps({'code':200, 'msg':'Your info have been saved', 'reactivate':0, 'username':new_username, 'email': new_email, 'name': data['name'], 'lastname': data['lastname']})

            else:
                error_msg = "you have no permission to update this"
                raise
        except Exception as e:
            conn.rollback()
            return json.dumps({'code':400, 'msg':" Your info could not be saved: "+ error_msg + " " + str(e)})
        except:
            conn.rollback()

    elif request.method == 'DELETE': # D-eletes user's info [test]
        try:
            user_id = session.get('user_id', None)
            if user_id is not None:
                cur.execute("DELETE FROM general_users WHERE id_user=%s" , (user_id,))
                conn.commit()
                session.pop('user_id', None) # delete session 
                return json.dumps({'code':200, 'msg':"user deleted"})
            else:
                return json.dumps({'code':400, 'msg':"bad request"})
        except Exception as e:
            conn.rollback()
            return json.dumps({'code':400, 'msg':"user could not be deleted" + " " + str(e)})
        except:
            conn.rollback()

# # # # # # # # SESSION SERVICES # # # # # # # # 

# basically log in
@app.route('/api/login',methods=['POST'])
def api_login(): 
    error_msg = ""
    if request.method == 'POST':
        try:
            user_id = session.get('user_id', None)
            if user_id is None:

                data = request.get_json()
                username = data['username'].lower()
                coded_pass = hashlib.md5((data['password'] + hash_key).encode('utf-8')).hexdigest() # encode the pass
                cur.execute("SELECT * FROM general_users WHERE username=%s AND password=%s" , (username,coded_pass))
                row = cur.fetchone()
                if row:
                    if row['active'] == 1:
                        session['user_id'] = row['id_user']
                        session['user_rol'] = row['rol']
                        session['user_username'] = row['username']
                        cur.execute("SELECT name FROM general_users_rols WHERE id_user_rol = %s" , (row['rol'],))
                        row_rol = cur.fetchone()
                        session['user_rolname'] = row_rol['name']
                        return json.dumps({'code':200, 'msg': 'Welcome '+ row['username'] + ' !','username': row['username'], 'name': row['name'], 'lastname': row['lastname'],'email': row['email'] })
                    else:
                        error_msg = " your account hasn't been activated "
                        raise
                else:
                    error_msg = " username and password doesn't match "
                    raise
            else:
                error_msg = "you are already logged in"
                raise

        except Exception as e:
            conn.rollback()
            return json.dumps({'code':400, 'msg': error_msg + " " + str(e)})
        except:
            conn.rollback()

# basically log out
@app.route('/api/logout',methods=['GET'])
def api_logout(): 
    try:
        session.pop('user_id', None)
        return json.dumps({'code':200, 'msg':"you have been logged out"})
    except Exception as e:
        conn.rollback()
        return json.dumps({'code':400, 'msg':"something went wrong while loggin you out" + " " + str(e)})
    except:
        conn.rollback()

# Recover Password
@app.route('/api/recover', methods=['POST'])
def api_recover():
    try:
        error_msg = ""
        data = request.get_json()
        email = data['email'].lower()
        cur.execute("SELECT username FROM general_users WHERE email=%s" , (email,))
        
        if cur.countrow > 0: # The activation exist
            user = cur.fetchone()
            auxpass = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            coded_pass = hashlib.md5((auxpass + hash_key).encode('utf-8')).hexdigest() # encode the pass
            cur.execute("INSERT INTO general_users (password) VALUES (%s) ", (coded_pass,))
            mobmail("Recover user data for "+user['username'], email, "Username: "+user['username']+" |  New Password: "+ user['password'], None, None);
            return json.dumps({'code':200, 'msg':"Your data has been sent to your email."})
        else:
            error_msg = " there's no such email registered"
            raise
    except Exception as e:
        conn.rollback()
        return json.dumps({'code':400, 'msg':"something went wrong: " + error_msg + " " + str(e)})
    except:
        conn.rollback()

# # # # # # # # TAGS/ COLLECTIONS SERVICES # # # # # # # # 

@app.route('/api/getcollections', methods=['GET'])
def api_collections():
    return json.dumps({'code':200, 'data':db_allcollections()})

@app.route('/api/gettags', methods=['GET'])
def api_tags():
    return json.dumps({'code':200, 'data':db_alltags()})

# # # # # # # # SCORE SERVICES # # # # # # # # 

@app.route('/api/globalscore', methods=['POST'])
def api_globalscore():
    try:
        data = request.get_json()
        url = data['url']
        error_msg = ""
        # getting the page's id
        cur.execute("SELECT id_web_page FROM mob_web_page WHERE url=%s" , (url,))
        id_web_page = cur.fetchone()
        if not id_web_page: # The web page doesn't exists
            error_msg = " There's no web page with that url"
            raise

        user_scores = []
        for x in range(0,11):
            # getting the list of all segmentations according to the granularity
            query = "SELECT u.username, d.mob_score "
            query += "FROM mob_segmentation_details as d "
            query += "INNER JOIN general_users as u ON u.id_user = d.id_user "
            query += "WHERE d.id_web_page = %s AND d.mob_gran =%s AND u.username<> %s"
            query += "ORDER BY d.mob_score DESC LIMIT 1; "

            cur.execute(query , (id_web_page['id_web_page'], x,'mob'))
            score = cur.fetchone()
   
            if score:
                user_scores.append({'username':score['username'],'score':score['mob_score']})
            else:
                user_scores.append({'username':'----','score':0})

        return json.dumps({'code':200, 'data': user_scores})

    except Exception as e:
        conn.rollback()
        return json.dumps({'code':400, 'msg':"something went wrong: "+ error_msg + " " + str(e)})
    except:
        conn.rollback()

@app.route('/api/userscore', methods=['POST'])
def api_userscore():

    try:
        error_msg = ""
        data = request.get_json()
        url = data['url']
        username = data['username']
        username = username.lower()
        # getting the user's id
        cur.execute("SELECT id_user FROM general_users WHERE username=%s" , (username,))
        id_user = cur.fetchone()
        if not id_user: # The user doesn't exists
            error_msg = " There's no user with that username"
            raise
        # getting the page's id
        cur.execute("SELECT id_web_page FROM mob_web_page WHERE url=%s" , (url,))
        id_web_page = cur.fetchone()
        if not id_web_page: # The web page doesn't exists
            error_msg = " There's no web page with that url"
            raise

        user_scores = []

        for i in range (11):
            # getting the list of all segmentations according to the granularity
            query = "SELECT mob_score "
            query += "FROM mob_segmentation_details "
            query += "WHERE id_user = %s AND id_web_page = %s AND mob_gran = %s;"
            cur.execute(query , (id_user['id_user'],id_web_page['id_web_page'], i))
            score = cur.fetchone()
            if score: # The score exists on that gran and web page exists
                user_scores.append(score['mob_score'])
            else:
                user_scores.append(0)

        return json.dumps({'code':200, 'data': user_scores})

    except Exception as e:
        conn.rollback()
        return json.dumps({'code':400, 'msg':"something went wrong: "+ error_msg + " " + str(e)})
    except:
        conn.rollback()

# # # # # # # # SEGMENTATION SERVICES # # # # # # # # 

# Upload segmentation data
@app.route('/api/upload', methods=['POST'])
def api_upload():
    try:
        error_msg = ""
        user_id = session.get('user_id', None)
        
        if user_id is not None:
            data = request.get_json()
            # Check the web page
            cur.execute("SELECT id_web_page FROM mob_web_page WHERE url = %s", (data['url'],))
            id_page = cur.fetchone()

            if id_page is None:
                # Create Web Page
                if data['capture'] is not None and data['collection'] is not None and data['category'] and  data['title'] is not None and  data['width'] is not None and  data['height'] is not None:
                    cur.execute("INSERT INTO mob_web_page (title,url,collection,category, width, height, capture) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id_web_page ", (data['title'], data['url'], data['collection'], data['category'], data['width'], data['height'], data['capture']))
                    conn.commit() 
                    id_page = cur.fetchone()
                    seg_queue.put({'id':id_page['id_web_page'], 'url': data['url'], 'op':2})
                else:
                    error_msg = "The page doesn't exist, you need to add: title, url, collection, category, width, height and capture in order to create it "
                    raise

            # Check if theres a segmentation with that user on that page, with that segmentation type, with that granularity
            cur.execute("SELECT id_details FROM mob_segmentation_details WHERE id_user = %s AND id_web_page = %s AND seg_type = %s AND mob_gran = %s", (user_id, id_page['id_web_page'], data['seg_type'], data['gran']))
            id_d = cur.fetchone()

            if id_d is not None: # Segmentation exists, It gets deleted
                db_ddetails(id_d['id_details'])

            # Create Segmentation Details
            if data['seg_type'] == 'mob':
                cur.execute("INSERT INTO mob_segmentation_details (id_user, id_web_page, mob_blocks, mob_html, mob_date, mob_browser, mob_gran, seg_type) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id_details", (user_id, id_page['id_web_page'],json.dumps(data['blocks']),data['mob_html'], str(datetime.datetime.now()), data['browser'],data['gran'],data['seg_type']))
            else:
                cur.execute("INSERT INTO mob_segmentation_details (id_user, id_web_page, mob_blocks, mob_date, mob_browser, mob_gran, seg_type) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id_details", (user_id, id_page['id_web_page'],json.dumps(data['blocks']), str(datetime.datetime.now()), data['browser'],data['gran'],data['seg_type']))

            conn.commit()
            id_details = cur.fetchone()

            # Insert all the geo blocks for the geo format.
            for b in data["blocks"]["block"]:
                geo_block = 'LINESTRING('+str(b['left'])+' '+str(b['top'])+', '+str(b['left']+b['width'])+' '+str(b['top'])+', '+str(b['left']+b['width'])+' '+str(b['top']+b['height'])+', '+str(b['left'])+' '+str(b['top']+b['height'])+', '+str(b['left'])+' '+str(b['top'])+')'
                cur.execute("INSERT INTO mob_segmentation_geo (id_details, tag, block, block_id, words, elems, dom, gran) VALUES (%s,%s,ST_GeomFromText(%s),%s,%s,%s,%s,%s)", (id_details['id_details'],b['tag'],geo_block,b['id'], b['words'], b['elems'], json.dumps(b['dom']), b['gran']))
            conn.commit()

            if data['seg_type'] == "mob":
                seg_queue.put({'id':id_details['id_details'], 'op': 1})

            return json.dumps({'code':200, 'msg': "upload completed successfully"})

        else:
            error_msg = "You need to log in before sending a segmentation."
            raise

    except Exception as e:
        conn.rollback()
        return json.dumps({'code':400, 'msg':"something went wrong: " + error_msg + " " + str(e)})
    except:
        conn.rollback()

# Get Segmentation Preview
@app.route('/api/segpreview/<p_id>/<zoom>', methods=['GET'])
def get_segpreview(p_id, zoom):
    try:
        cur.execute("SELECT mob_blocks, id_web_page FROM mob_segmentation_details WHERE id_details = %s", (p_id,))
        aux = cur.fetchone()

        cur.execute("SELECT width, height FROM mob_web_page WHERE id_web_page = %s", (aux['id_web_page'],))
        aux2 = cur.fetchone()

        data = []

        for b in aux['mob_blocks']['block']:
            data.append({'w': b['width'], 'h': b['height'], 'l': b['left'], 't': b['top'], 'tag': b['tag'], 'id': b['id'] })
            
        return render_template('seg_preview.html', zoom = zoom, data = data, width= aux2['width'] , height= aux2['height'] )
    except:
        conn.rollback()

# # # # # # # # DOWNLOAD FORMATS SERVICES # # # # # # # # 

#Singular Segmentation JSON FORMAT
@app.route('/api/seg:<id>.js', methods=['GET'])
def get_jsonformat(id):
    try:
        cur.execute("""SELECT d.mob_score as score, d.mob_blocks as blocks, mob_date as date, d.mob_browser as browser, d.mob_gran as gran, d.id_web_page as id_page, u.username as user, d.seg_type as type
                        FROM mob_segmentation_details as d 
                        INNER JOIN general_users as u ON u.id_user = d.id_user 
                        WHERE d.id_details = %s """, 
                        (id,))            
        if cur.rowcount > 0:
            seg_info = cur.fetchone()
            cur.execute("SELECT title, url, collection, category, width, height FROM mob_web_page WHERE id_web_page = %s", (seg_info['id_page'],)) 

            if cur.rowcount > 0 :
                db_page= cur.fetchone() # save the web page data
                response = {}
                response['page'] = {}
                response['seg'] = {}
                response['page']['title'] = db_page['title']
                response['page']['url'] = db_page['url']
                response['page']['collection'] = db_page['collection']
                response['page']['category'] = db_page['category']
                response['page']['width'] = db_page['width']
                response['page']['height'] = db_page['height']
                response['seg']['score'] = seg_info['score']
                response['seg']['blocks'] = seg_info['blocks']
                response['seg']['date'] = seg_info['date']
                response['seg']['browser'] = seg_info['browser']
                response['seg']['gran'] = seg_info['gran']
                response['seg']['id_page'] = seg_info['id_page']
                response['seg']['user'] = seg_info['user']
                response['seg']['type'] = seg_info['type']

                return json.dumps(response)
            else:
                return json.dumps({'code':400, 'msg': "Page information can't be found"})
        else:
            return json.dumps({'code':400, 'msg': "Segmentation can't be found"})
    except:
        conn.rollback()

#Singular Segmentation MoB HTML FORMAT (doesn't work on best segmentations) 
@app.route('/api/seg:<id>_mob.html', methods=['GET'])
def get_mobformat(id):
    try:
        cur.execute("""SELECT d.mob_html as html
                        FROM mob_segmentation_details as d 
                        WHERE d.id_details = %s """, 
                        (id,))            
        if cur.rowcount > 0:
            html_string = cur.fetchone()[0]
            page = BeautifulSoup(html_string, 'html.parser')
            page.find(id="loadscreen").attrs['hidden'] = True
            page.find(id="mob_modal").attrs['hidden'] = True
            page.find(id="MoB-Menu").attrs['hidden'] = True
            return page.prettify()
        else:
            return json.dumps({'code':400, 'msg': "Segmentation can't be found or it's format is not available"})
    except:
        conn.rollback()

#Singular Segmentation V-PRIMA FORMAT
@app.route('/api/seg:<id>_vprima.xml', methods=['GET'])
def get_vprimaformat(id):
    try:
        cur.execute("""SELECT id_web_page
                        FROM mob_segmentation_details as d 
                        WHERE d.id_details = %s """, 
                        (id,))            
        if cur.rowcount > 0:
            id_page = cur.fetchone()[0]
            xml_string = vprima(id_page,id)
            return xml_string
        else:
            return json.dumps({'code':400, 'msg': "Segmentation can't be found or it's format is not available"})
    except:
        conn.rollback()

#Singular Web page Information in WARC FORMAT
@app.route('/api/pa:<id>.warc.gz')
def get_warcformat(id):
    filename = 'warcs/'+ str(id) + '.warc.gz'
    return app.send_static_file(filename)

#Extension in CRX FORMAT or ZIP FORMAT
@app.route('/api/download_<name>')
def get_mobext(name):
    filename = 'ext/'+name
    return app.send_static_file(filename)

# # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #
# # # # # # #  # # # # # # #  # # # # # #   MOB REPOSITORY  # # # # # # #  # # # # # # #  # # # # # # # 
# # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #

# PRINCIPAL
@app.route('/')
def index():
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    return render_template('home.html', rol= rol, search=search)

@app.route('/test')
def test():
    return render_template('test_seg.html')

# Search View
@app.route('/search', methods=['POST','GET'])
def search():
    try:
        if request.method == 'POST':
            search = searchdata() # getting all data for the search bar
            rol = session.get('user_rol', None)
            if request.form['op'] == 'user': #searchs for an user
                return get_userinfo(request.form['key'])

            else: #searchs for a page
                if isNotEmpty(request.form['key']):
                    # creating the regular expression with the keys
                    aux = request.form['key'].split()
                    keys=".*("
                    for l in aux:
                        keys = keys + l + "|"
                    keys = keys[:-1] + ").*"

                if request.form['collection'] == 'all': # all collections and all categories
                    if isNotEmpty(request.form['key']): # all web pages in db
                        cur.execute("SELECT id_web_page as id, title, capture FROM mob_web_page WHERE title ~* %s OR url ~* %s", (keys,keys))
                    else: #all web pages that are similar to the keys
                        cur.execute("SELECT id_web_page as id, title, capture FROM mob_web_page")
                        
                else:
                    if request.form['category'] == 'all': # on X collection, and all categories

                        if isNotEmpty(request.form['key']): # all web pages in db
                            cur.execute("SELECT id_web_page as id, title, capture FROM mob_web_page WHERE (title ~* %s OR url ~* %s) AND collection ILIKE %s", (keys,keys,str(request.form['collection']) ))
                        else: #all web pages that are similar to the keys
                            cur.execute("SELECT id_web_page as id, title, capture FROM mob_web_page WHERE collection ILIKE %s", (str(request.form['collection']),))

                    else: # on X collection and Y category
                        if isNotEmpty(request.form['key']): # all web pages in db
                            cur.execute("SELECT id_web_page as id, title, capture FROM mob_web_page WHERE (title ~* %s OR url ~* %s) AND collection ILIKE %s AND category ILIKE %s", (keys,keys,request.form['collection'],request.form['category'] ))
                        else: #all web pages that are similar to the keys
                            cur.execute("SELECT id_web_page as id, title, capture FROM mob_web_page WHERE collection ILIKE %s AND category ILIKE %s", (request.form['collection'],request.form['category']))

                if cur.rowcount > 0:
                    pages = cur.fetchall()
                    return render_template('search.html', rol=rol, data=pages, search=search)
                else:
                    return render_template('search.html', error="No results that match your search",rol=rol, search=search)
        else:
            return index()
    except:
        conn.rollback()

# Downloads View
@app.route('/downloads')
def downloads():
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    return render_template('downloads.html', rol=rol, search=search)

# Downloads View
@app.route('/tutorials')
def tutorials():
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    return render_template('tutorials.html', rol=rol, search=search)

# Downloads View
@app.route('/doc')
def get_doc():
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    return render_template('doc.html', rol=rol, search=search)

# Tags Info View
@app.route('/tagsinfo')
def tagsinfo():
    data = db_alltags() #get all tags
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    return render_template('tagsinfo.html', rol=rol, list= data, search=search)

# Help View
@app.route('/faqs')
def faqs():
    try:
        rol = session.get('user_rol', None)
        search = searchdata() # getting all data for the search bar
        cur.execute("SELECT * FROM general_users_rols")
        data = cur.fetchall()
        return render_template('help.html', rol=rol, search=search, rols_info = data)
    except:
        conn.rollback()

#User Info View
@app.route('/u:<string:user>', methods=['GET'])
def get_userinfo(user):
    try:
        rol = session.get('user_rol', None)
        search = searchdata() # getting all data for the search bar
        cur.execute(""" SELECT u.id_user, u.name, u.username, u.lastname, u.email, ur.name as rolname 
            FROM general_users as u 
            INNER JOIN general_users_rols as ur ON ur.id_user_rol = u.rol 
            WHERE username = %s"""
            , (user.lower(),))
        data = cur.fetchone()

        cur.execute("SELECT name, id_user_rol as id FROM general_users_rols")
        user_rols = cur.fetchall()

        if data is None:
            return render_template('userinfo.html', search= search, error="The username doesn't exists in our records. ", rol=rol)
        else:
            return render_template('userinfo.html', search=search, user = data, rols= user_rols, rol=rol)
    except:
        conn.rollback()

#Singular Segmentation Info View
@app.route('/seg:<id>', methods=['GET'])
def get_seginfo(id):
    try:
        rol = session.get('user_rol', None)
        search = searchdata() # getting all data for the search bar
        error_msg = ""
    
        cur.execute("""SELECT *
                        FROM mob_segmentation_details as d 
                        INNER JOIN general_users as u ON u.id_user = d.id_user 
                        WHERE d.id_details = %s """, 
                        (id,))      
   
        if cur.rowcount > 0:
            seg_info = cur.fetchone()
            cur.execute("SELECT * FROM mob_web_page WHERE id_web_page = %s", (seg_info['id_web_page'],)) 
  
            if cur.rowcount > 0 :
                db_page= cur.fetchone() 
                gt = 0
                if seg_info['mob_status'] == 'best':
                    cur.execute(""" SELECT count(id_details) 
                        FROM mob_segmentation_details
                        WHERE id_web_page= %s AND mob_gran = %s AND mob_status= %s""",
                        (seg_info['id_web_page'],seg_info['mob_gran'],'scored'))
                    gt = cur.fetchone()[0]
   
                return render_template('seginfo.html', page = db_page, seg= seg_info, pa= db_page['id_web_page'] , co= db_page['collection'], ca = db_page['category'], rol=rol, search=search, gt= gt )
            else:
                return render_template('seginfo.html', error="That web page doesn't exist on our records" , rol=rol, search=search  )
        else:
            return render_template('seginfo.html', error="That segmentation couldn't be found" , rol=rol, search=search  )
    except Exception as e:
        print(e)
        conn.rollback()

# Collections View
@app.route('/collections')
def get_collections():
    rol = session.get('user_rol', None)
    data = db_allcollections() # getting all collections
    search = searchdata() # getting all data for the search bar
    if data is not None:
        return render_template('collections.html', rol=rol, list=data, search=search)
    else:
        return render_template('collections.html', rol=rol, error="No collections found", search = search)

#Categories View
@app.route('/co:<string:collection>', methods=['GET'])
def get_categories(collection):
    try:
        rol = session.get('user_rol', None)
        search = searchdata() # getting all data for the search bar
        cur.execute("SELECT categories FROM mob_collections WHERE name=%s", (collection,))
        if cur.rowcount > 0:
            string = cur.fetchone()
            data = string['categories'].split(',')
            return render_template('categories.html', search= search, co=collection, rol=rol, list=data)
        else:
            return render_template('categories.html', search= search, co=collection, rol=rol, error="No categories found on this collection")
    except:
        conn.rollback()

# Web Pages View
@app.route('/co:<string:collection>/ca:<string:category>', methods=['GET'])
def get_webpages(collection,category):
    try:
        rol = session.get('user_rol', None)
        search = searchdata() # getting all data for the search bar
        cur.execute("SELECT id_web_page as id, title, url, capture FROM mob_web_page WHERE collection = %s AND category = %s", (collection,category))

        if cur.rowcount > 0 :
            data = cur.fetchall()
            return render_template('webpages.html', data= data, co= collection, ca = category, rol=rol, search=search )
        else:
            return render_template('webpages.html', error="No web page found on this category" , co= collection, ca = category, rol=rol ,search=search )
    except:
        conn.rollback()

# Web Pages Info View
@app.route('/pa:<page>', methods=['GET'])
def get_pageinfo(page):
    try:
        rol = session.get('user_rol', None)
        search = searchdata() # getting all data for the search bar
        error_msg = ""
        cur.execute("SELECT * FROM mob_web_page WHERE id_web_page = %s", (page,)) 

        if cur.rowcount > 0 :
            db_page= cur.fetchone() # save the web page data
            db_gran_info = []

            for x in range(11): # looking for the best segmentations on each granularity
                cur.execute("""SELECT *
                                FROM mob_segmentation_details as d 
                                INNER JOIN general_users as u ON u.id_user = d.id_user 
                                WHERE d.id_web_page= %s AND d.mob_gran = %s AND (d.mob_status= %s OR d.seg_type <> %s) 
                                ORDER BY d.mob_status""", 
                                (page, x, 'best', 'mob'))           
                if cur.rowcount > 0:
                    aux = cur.fetchall()
                    cur.execute(""" SELECT count(id_details) 
                        FROM mob_segmentation_details
                        WHERE id_web_page= %s AND mob_gran = %s AND mob_status= %s""",
                        (page,x,'scored'))
                    db_gran_info.append({'segs': aux, 'gt': cur.fetchone()[0]})

                else:
                    db_gran_info.append(0)
            return render_template('pageinfo.html', page = db_page, list= db_gran_info, pa= page , co= db_page['collection'], ca = db_page['category'], rol=rol, search=search )
        else:
            return render_template('pageinfo.html', error="That web page doesn't exist on our records" , rol=rol, search=search  )
    except:
        conn.rollback()

# Delete Web Page
@app.route('/del_webpage/<id>/<col>/<ca>', methods=['GET'])
def del_webpage(id,col,ca):
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    if rol == 1:
        db_dwebpage(id)
        flash(" Page deleted succesfully","success")
        return redirect( url_for('get_webpages', collection=col, category=ca) ) 
    else:
        return render_template('home.html', error='You have no permission to enter here', rol=rol, search=search)

# Delete Segmentation
@app.route('/del_seg/<id>/<back>/<id_back>/<gran>', methods=['GET'])
def del_seg(id,back,id_back, gran = 0):
    try:
        rol = session.get('user_rol', None)
        search = searchdata() # getting all data for the search bar
        if rol == 1:
            cur.execute("SELECT id_web_page, mob_gran FROM mob_segmentation_details WHERE id_details =%s",(id,))
            pinfo = cur.fetchone()
            db_ddetails(id)
            new_best_seg(pinfo['id_web_page'],pinfo['mob_gran'])
            if back == "seg_page":
                flash(" Segmentation deleted succesfully","success")
                return redirect( url_for('get_listsegpage', id=id_back, gran = gran) )
            elif back == "seg_user":
                flash(" Segmentation deleted succesfully","success")
                return redirect( url_for('get_listseguser', id=id_back) )
            else:
                return render_template('home.html', error='We do not know how you get here', rol=rol, search=search)
        else:
            return render_template('home.html', error='You have no permission to enter here', rol=rol, search=search)
    except:
        conn.rollback()

####### TAGS CRUD  ####### 
@app.route('/tagsedit', methods=['GET','POST'])
def tagsedit():
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    if rol == 1:
        if request.method == 'GET':
            data = db_alltags() #get all tags
            return render_template('tagsinfo.html', edit= True, rol=rol, list= data, search=search) 

        elif request.method == 'POST':
            if request.form['method'] == 'POST':
                db_newtag(request.form) ##create new tag
                data = db_alltags() #get all tags
                flash("Tag created succesfully","success")
                return render_template('tagsinfo.html', edit= True, rol=rol, list= data, search=search)

            elif request.form['method'] == 'PUT':
                    db_utag(request.form) #update tag
                    data = db_alltags() #get all tags
                    flash("Tag updated succesfully","success")
                    return render_template('tagsinfo.html', edit= True, rol=rol, list= data, search=search)

            elif request.form['method'] == 'DELETE':
                    db_dtag(request.form) #delete tag
                    data = db_alltags() #get all tags
                    flash("Tag deleted succesfully","success")
                    return render_template('tagsinfo.html', edit= True, rol=rol, list= data, search=search)
    else:
        return render_template('tagsinfo.html', error='You have no permission to enter here', rol=rol, search=search)

####### COLLECTIONS CRUD  ####### 
@app.route('/collectionsedit', methods=['GET','POST'])
def collectionsedit():
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    if rol == 1:
        if request.method == 'GET':
            data = db_allcollections() # getting all collections
            return render_template('collections.html', edit= True, rol=rol, list= data, search=search) 

        elif request.method == 'POST':
            if request.form['method'] == 'POST':
                db_newcollection(request.form) # create a collection
                data = db_allcollections() # getting all collections
                flash("Collection created succesfully","success")
                return render_template('collections.html', edit= True, rol=rol, list= data, search=search)

            elif request.form['method'] == 'PUT':
                db_ucollection(request.form) # update collection
                data = db_allcollections() # getting all collections
                flash("Collection updated succesfully","success")
                return render_template('collections.html', edit= True, rol=rol, list= data, search=search)

            elif request.form['method'] == 'DELETE':
                db_dcollection(request.form) #delete collection
                data = db_allcollections() # getting all collections
                flash("Collection deleted succesfully","success")
                return render_template('collections.html', edit= True, rol=rol, list= data, search=search)
    else:
        return render_template('collections.html', error='You have no permission to enter here', rol=rol, search=search)

# Activation 
@app.route('/mobactivate/<key_id>/<string:key>', methods=['GET'])
def mob_activate(key_id,key):
    try:
        search = searchdata() # getting all data for the search bar
        cur.execute("SELECT id_user FROM general_users_activation WHERE id_activation=%s AND hash=%s" , (key_id,key))
        id_user = cur.fetchone()
        if id_user: # The activation exist
            cur.execute("UPDATE general_users SET active=1 WHERE id_user = %s", (id_user['id_user'],))
            conn.commit()
            return render_template('activate.html', msg='The account has been activated!',search=search )
        else:
            return render_template('activate.html', error='something went wrong with the activation, try again', search=search)
    except:
        conn.rollback()

# User Rol edit
@app.route('/userroledit', methods=['POST'])
def userroledit():
    try:
        rol = session.get('user_rol', None)
        rol = 1
        search = searchdata() # getting all data for the search bar
        if rol == 1:
            cur.execute("UPDATE general_users SET rol=%s WHERE id_user=%s" , (request.form['rol'],request.form['id_user']) )
            conn.commit()
            flash("User data saved","success")
            return redirect(url_for('get_userinfo', user=request.form['username']))
        else:
            return index()
    except:
        conn.rollback()

# list of users
@app.route('/listusers', methods=['GET'])
def get_listusers():
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    data = db_listusers()

    return render_template('list.html', list="users", data = data ,rol=rol,search=search )

# list of segmentations acoording to a page
@app.route('/listseg/pa:<id>/gran:<gran>', methods=['GET'])
def get_listsegpage(id, gran):
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    data = db_listsegpage(id, gran)

    return render_template('list.html', list="seg_page", data = data ,rol=rol,search=search,pa=id )

# list of segmentations acoording to an user
@app.route('/listseg/u:<id>', methods=['GET'])
def get_listseguser(id):
    rol = session.get('user_rol', None)
    search = searchdata() # getting all data for the search bar
    data = db_listseguser(id)

    return render_template('list.html', list="seg_user", data = data ,rol=rol,search=search )


# # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #
# # # # # # #  # # # # # # #  # # # # # # #   FUNCTIONS   # # # # # # # #  # # # # # # #  # # # # # # # 
# # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #  # # # # # # #  # # # # # # # # # # # # # #

#############################################     UTILIYY   ######################################

def mobmail(subject, to, mensaje, btn, href):

    msg = Message( 
        recipients=[to],
        sender=("Me", "mobreplyteam@gmail.com"),
        reply_to="mobreplyteam@gmail.com",
        subject=subject,
        )

    msg.body =  ' <!DOCTYPE html> <html> <head>\
            <style> \
                .mobmail { border: 1px solid #5ac2ec; min-width: 100%;} .mobmail #title{text-align: center;font-size: 18px;color: #5ac2ec;border-bottom: 1px solid #5ac2ec;}.mobmail #msg {text-align: center;font-style: italic;}.mobmail #btn, .mobmail #btn:active , .mobmail #btn:focus{font-size: 24px;text-decoration: none;display: table;text-align: center;width: 100%;color:white;background-color: #5ac2ec;}.mobmail #btn:hover {color: white;background-color: #8bd5f3;}\
             </style> \
            </head> <body align="center"> \
            <table class="mobmail"> \
            <tr> <th id="title"> ' + subject + '</th>  </tr> \
            <tr id="msg"> <td>'  + mensaje + '</td> </tr>' 
    if btn is not None:
        msg.body = msg.body + '<tr> <td>  <a id ="btn" href="' + href +'"> ' +btn+'</a> </td>  </tr>'

    msg.body = msg.body  + '</table> </body></html>'

    msg.html = msg.body

    mail.send(msg)

def searchdata():
    # creates the object to fill the search bar options
    data = db_allcollections()
    data2 = []
    for c in data:
        data2.append({'name':c['name'], 'categories': c['categories'].split(',') })
    return data2

def isNotEmpty(s):
    # returns true if is not empty.
    return bool(s and s.strip())

def vprimaaux(op, elem, list):
    # helper function to fill the vidiff format.

    aux = ""
    auxname = ""
    auxhash = ""

    if op=="link" and elem['meta']['tagname'] == "A":
        if 'name' in elem['meta']:
            auxname = elem['meta']['name']
        
        if 'data-href' in elem['meta']:
            auxhash = hashlib.md5((elem['meta']['data-href']).encode('utf-8')).hexdigest()
        else:
            auxhash = hashlib.md5(("undefined").encode('utf-8')).hexdigest()
        
        list.append(auxhash)

        return '<link ID="'+auxhash+'" Name="'+auxname+'" Adr="'+elem['meta']['data-href']+'"/>'

    elif op=="img" and elem['meta']['tagname'] == "IMG":
        if 'name' in elem['meta']:
            auxname = elem['meta']['name']
        
        if 'src' in elem['meta']:
            auxhash = hashlib.md5((elem['meta']['src']).encode('utf-8')).hexdigest()
        else:
            auxhash = hashlib.md5(("undefined").encode('utf-8')).hexdigest()

        list.append(auxhash)
        return '<img ID="'+auxname+'" Name="'+auxname+'" Src="'+elem['meta']['src']+'"/>'

    elif op=="txt" and 'textvalue' in elem['meta'] and elem['meta']['tagname']!="A":

        if 'textvalue' in elem['meta']:
            auxhash = hashlib.md5((elem['meta']['textvalue']).encode('utf-8')).hexdigest()
        else:
            auxhash = hashlib.md5(("undefined").encode('utf-8')).hexdigest()
        
        list.append(auxhash)

        return '<txt ID="'+auxhash+'" Name="'+elem['meta']['tagname']+'" Value="'+elem['meta']['textvalue']+'"/>'

    for child in elem['content']:
        aux = aux + vprimaaux(op, child, list)

    return aux

def vprima(id_wp, id_s):
    # generates the vprima format of a given segmentation.
    cur.execute("SELECT * FROM mob_web_page WHERE id_web_page =%s",(id_wp,))
    page = cur.fetchone()

    cur.execute("SELECT mob_blocks as b FROM mob_segmentation_details WHERE id_details =%s",(id_s,))
    seg = cur.fetchone()[0] 

    MSVD = '<XML> <Document url="' +page['url']+ '" Title="' +page['title']+ '" Version="test" Pos="H:' + str(page['height'])+ '-W:' + str(page['width'])+ '">'
    cont = 0
    for b in seg['block']:

        list1 = []
        auxlist1 = ""
        aux1 = vprimaaux("link", b['dom'], list1)
        for l in list1:
                auxlist1 = auxlist1 + l + "," 
        auxlist1 = auxlist1[-1:]

        md51 = hashlib.md5((auxlist1).encode('utf-8')).hexdigest()

        list2 = []
        auxlist2 = ""
        aux2 = vprimaaux("img", b['dom'], list2)
        for l in list2:
                auxlist2 = auxlist2 + l + "," 
        auxlist2 = auxlist2[-1:]

        md52 = hashlib.md5((auxlist2).encode('utf-8')).hexdigest()

        list3 = []
        auxlist3 = ""
        aux3 = vprimaaux("txt", b['dom'], list3)
        for l in list3:
                auxlist3 = auxlist3 + l + "," 
        auxlist3 = auxlist3[-1:]
        
        md53 = hashlib.md5((auxlist3).encode('utf-8')).hexdigest()

        md5B = hashlib.md5((md51+","+md52+","+md53).encode('utf-8')).hexdigest()

        MSVD = MSVD + '<Block Ref="Block'+str(cont)+'" internal_id="'+b['id']+'" ID="'+md5B+'" Pos="H:'+str(b['height'])+"-W:"+str(b['width'])+'">';
        cont = cont + 1
        MSVD = MSVD + '<Links ID="'+md51+'" IDList="'+auxlist1+'">'
        MSVD = MSVD + aux1
        MSVD = MSVD + '</Links>'

        MSVD = MSVD + '<Imgs ID="'+md52+'" IDList="'+auxlist2+'">'
        MSVD = MSVD + aux2
        MSVD = MSVD + '</Imgs>'

        MSVD = MSVD + '<Txts ID="'+md53+'" IDList="'+auxlist3+'">'
        MSVD = MSVD + aux3
        MSVD = MSVD + '</Txts>'

        MSVD = MSVD + '</Block>'

    MSVD = MSVD + '</Document> </XML>'
    return MSVD


#############################################    DB FUNCTIONS   #######################################


# Delete blocks of a segmentation
def db_dallblocks(id):
    try:
        cur.execute("DELETE FROM mob_segmentation_geo WHERE id_details = %s",(id,))
        conn.commit()
    except:
        conn.rollback()

# Delete a details of a segmentation 
def db_ddetails(id):
    try:
        db_dallblocks(id)
        cur.execute("DELETE FROM mob_segmentation_details WHERE id_details = %s",(id,))
        conn.commit()
    except:
        conn.rollback()

# Delete a Web Page
def db_dwebpage(id):
    try:
        cur.execute("DELETE FROM mob_web_page WHERE id_web_page = %s",(id,))
        conn.commit()

        cur.execute("SELECT id_details FROM mob_segmentation_details WHERE id_web_page = %s",(id,))
        segs = cur.fetchall()

        for s in segs:
            db_ddetails(s['id_details'])
    except:
        conn.rollback()

# List of segmentations of a WebPage ordered by score, giving a webpage id
def db_listsegpage(id, gran):
    try:
        if gran == 'all':
            cur.execute(""" SELECT d.id_details, d.mob_score, d.id_user, d.id_web_page, d.mob_gran, d.mob_date, u.username 
                FROM mob_segmentation_details as d
                INNER JOIN general_users as u ON u.id_user = d.id_user
                WHERE d.id_web_page = %s AND d.seg_type = %s
                ORDER BY d.mob_gran, d.mob_score DESC, u.username """
                ,(id,'mob'))
            return cur.fetchall()
        else:
            cur.execute(""" SELECT d.id_details, d.mob_score, d.id_user, d.id_web_page, d.mob_gran, d.mob_date, u.username 
                FROM mob_segmentation_details as d
                INNER JOIN general_users as u ON u.id_user = d.id_user
                WHERE d.id_web_page = %s AND d.seg_type = %s AND d.mob_gran = %s
                ORDER BY d.mob_gran, d.mob_score DESC, u.username """
                ,(id,'mob', gran))
            return cur.fetchall()
    except:
        conn.rollback()

# List of segmentations of a WebPage ordered by score, giving an user id
def db_listseguser(id):
    try:
        cur.execute(""" SELECT d.id_details, d.mob_score, d.id_user, d.id_web_page, d.mob_gran, d.mob_date, u.username, p.title 
            FROM mob_segmentation_details as d
            INNER JOIN general_users as u ON u.id_user = d.id_user
            INNER JOIN mob_web_page as p ON p.id_web_page = d.id_web_page
            WHERE d.id_user = %s 
            ORDER BY p.title, d.mob_gran, d.mob_score DESC """
            ,(id,))
        return cur.fetchall()
    except:
        conn.rollback()

# List of users on the site
def db_listusers():
    try:
        cur.execute(""" SELECT u.id_user, u.username, r.name
            FROM general_users as u
            INNER JOIN general_users_rols as r ON r.id_user_rol = u.rol
            GROUP BY r.name, u.username, u.id_user
            ORDER BY r.name ASC """)
        return cur.fetchall()
    except:
        conn.rollback()

# Get a single segmentation info.
def db_getseg(id):
    try:
        cur.execute(""" SELECT d.id_details, d.mob_score, d.id_user, d.id_web_page, d.mob_gran, d.mob_status, d.seg_type, d.mob_date, d.mob_blocks, u.username, p.title 
            FROM mob_segmentation_details as d
            INNER JOIN general_users as u ON u.id_user = d.id_user
            INNER JOIN mob_web_page as p ON p.id_web_page = d.id_web_page
            WHERE d.id_details = %s  """
            ,(id,))
        return cur.fetchone()
    except:
        conn.rollback()

# Get all collections
def db_allcollections():
    try:
        cur.execute("SELECT * FROM mob_collections ORDER BY name ASC")
        data = cur.fetchall()
        return data
    except:
        conn.rollback()

# Create new collection
def db_newcollection(col):
    try:
        cur.execute("INSERT INTO mob_collections (name, categories) VALUES (%s,%s)" , (col['name'],col['categories']) )
        conn.commit()
    except:
        conn.rollback()

# Update collection
def db_ucollection(col):
    try:
        cur.execute("UPDATE mob_collections SET name=%s, categories=%s WHERE id_collection=%s" , (col['name'],col['categories'],col['id_collection']) )
        conn.commit()
    except:
        conn.rollback()

# Delete collection
def db_dcollection(col):
    try:
        cur.execute("DELETE FROM mob_collections WHERE id_collection=%s" , (col['id_collection'],))
        conn.commit()
    except:
        conn.rollback()

# Get all tags
def db_alltags():
    try:
        cur.execute("SELECT * FROM mob_tags ORDER BY name ASC")
        data = cur.fetchall()
        return data
    except:
        conn.rollback()

# Create new tag
def db_newtag(tag):
    try:
        cur.execute("INSERT INTO mob_tags (name, desc_esp, desc_eng, desc_fra) VALUES (%s,%s,%s,%s)" , (tag['name'],tag['desc_esp'],tag['desc_eng'],tag['desc_fra']) )
        conn.commit()
    except:
        conn.rollback()

# Update tag
def db_utag(tag):
    try:
        cur.execute("UPDATE mob_tags SET name=%s, desc_esp=%s, desc_eng=%s, desc_fra=%s WHERE id_tag=%s" , (tag['name'],tag['desc_esp'],tag['desc_eng'],tag['desc_fra'], tag['id_tag']) )
        conn.commit()
    except:
        conn.rollback()

# Delete tag
def db_dtag(tag):
    try:
        cur.execute("DELETE FROM mob_tags WHERE id_tag=%s" , (tag['id_tag'],))
        conn.commit()
    except:
        conn.rollback()

# Running app
app.secret_key = os.urandom(10) 

if __name__ == '__main__':
	app.run( debug =  True, threaded=True)
