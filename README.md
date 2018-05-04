# Sistema MoB

El sistema MoB es un proyecto de software libre creado por Jean Garcia en el 2017, está apoyado en los trabajos de investigación de Andrés Sanoja y Stéphane Gançarski del 2014.

El sistema MoB actualmente se encuentra en uso bajo el siguiente dominio: <https://mob.ciens.ucv.ve>

---
## ¿Cuál es la finalidad el sistema MoB? 

La finalidad del sistema MoB es la creacion de un ground truth o base de la verdad, conformada por diversas segmentaciones manuales de diversas páginas Web, dichas segmentaciones son creadas por usuarios y en base a ellas se obtiene una **mejor segmentación**, dicha segmentación puede entonces ser usada para evaluar las segmentaciones resultantes de los algoritmos de segmentación. 

---
## ¿Cuáles son los componentes que conforman el sistema?

El sistema esta conformado por tres componentes: 

- La Extensión MoB: Permite el registro e identificación de los usuarios en el sistema, además ofrece una herramienta de segmentación manual para que el usuario realice la segmentación y envie los datos.  

- La API de MoB: Es un API RESTful que ofrece diferentes servicios para los interesados en obtener los datos de las segmentaciones almacenadas en el sistema, también funciona como el backend del Repositorio MoB.

- El Repositorio MoB: Es el sitio oficial del sistema MoB, ademas es donde se pueden observar y descargar todas las segmentaciones almacenadas en el sistema. 

---
## Directorio

En la carpeta **"MoB Extension"** encontrará el código de la extensión de MoB, si busca por el archivo en formato ZIP o CRX haga click aqui: <https://mob.ciens.ucv.ve/downloads>

En la carpeta **"MoB API and MoB Repository"** Encontrará el código del API RESTful y del sitio Repositorio MoB.

---
## ¿Desear continuar con el proyecto o usarlo como base para otro?

Seguro, aquí te damos los pasos para la configuración del ambiente de desarrollo que debes tener para correr el sistema. 

---
### Para el API RESTful:

Necesitarás de Python 3.5 o superior y módulos extras.

**Instalar Python 3.5:**

- Ubuntu:
Si posees Ubuntu 16 o superior probablemente ya tu sistema posea Python 3.5, sin embargo el comando sería:

`sudo apt-get install python3`

- Windows:
Puedes descargar el instalador directamente de su página oficial: <https://www.python.org/downloads/windows/>

**Instalar los Módulos: **

Puedes instalar cada módulo usando la herramienta **pip** que viene con la instalación de Python 3. Al lado de cada nombre se especifica el comando de instalación.


- flask (0.12.2) ->  `sudo pip3 install flask`
- flask_cors (3.0.3) -> `sudo pip3 install flask_cors`
- flask_mail (0.9.1) -> `sudo pip3 install flask_mail`
- psycopg2 (2.7.3) -> `sudo pip3 install psycopg2`
- bs4 (0.0.1) -> `sudo pip3 install bs4`

---
### Para el Sistema Manejador de Base de Datos:

** Instalar la base de datos requerida, Postgresql (v.10.1) **

- Ubuntu:

`sudo apt-get install postgresql-10.1`

- Windows:
Puedes descargar el instalador directamente de su página oficial: <https://www.postgresql.org/download/>

**Instalar el complemento de Postgis (v.2.4)**

- Ubuntu: 
`sudo apt install postgis postgresql-10-postgis-4`
y
`sudo -u postgres psql -c "CREATE EXTENSION postgis; CREATE EXTENSION postgis_topology;" gisdata`

- Windows:
(Debe usar Windows de 64 bits)

1. Puede elegirlo de la lista de complementos/extensiones que le ofrece PGAdmin 4 (Viene con la instalación de Postgresql).

2. Puede instalar los binarios desde: <https://postgis.net/windows_downloads/>


Finalmente, se requiere la importación de los modelos para la base de datos, dichos modelos se encuentran en el archivo **MoB-API-and-MoB-Repository/db_models_sql.sql** , con usar esos queries en Postgresql debería ser suficiente para crear los modelos necesarios, también puede "restaurar" usando la versión **tar** del archivo en **MoB-API-and-MoB-Repository/db_models_tar**.

---
### Un último cambio:

Debes modificar las siguientes líneas en los archivos que se indican, para reemplazarlos con tu propia información. 

**MoB-API-and-MoB-Repository/mob_api.py (línea 20)**

```python
conn = psycopg2.connect(dbname='db_name', user='postgres_user', password='mypassword', port='5432') 
```

Coloca la información de tu base de datos.

**MoB-API-and-MoB-Repository/mob_api.py (línea 31, 32)**
```python
app.config['MAIL_USERNAME'] = 'myemail@gmail.com'
app.config['MAIL_PASSWORD'] = 'password'
```
Coloca el correo y contraseña del correo del que desees que se envíen los anuncios y mensajes de MoB. 

**MoB-API-and-MoB-Repository/mob_api.py (línea 39, 40, 41)**
```python
api_url = 'https://mob.ciens.ucv.ve/'
mobEnvURL = '/route-to-warcs-files/' 
hash_key = 'mykey'
```
Coloca la url del dominio donde se correrá el sistema, la palabra clave para la codificación hash y la URL absoluta donde deseas almacenar los archivos WARC que se creen, los archivos WARC son almacenados en la siguiente ruta:
```python
ruta = mobEnvURL+str(id)
```
**MoB-Extension/js/script.js (línea 18)**
```javascript
var api_url = 'https://mob.ciens.ucv.ve';
```
Coloca la url de tu dominio.

**MoB-Extension/js/popup.js (línea 4)**
```javascript
var api_url = 'https://mob.ciens.ucv.ve';
```
Coloca la url de tu dominio. 

** Nota: ** Tenga en cuenta que si usa un sistema operativo Windows, la funcionalidad que permite descargar las páginas en formato WARC no funcionará, pues "wget" es una utilidad que ya viene instalada en los sistemas Ubuntu/Linux, para usarlo en Windows tendrá que instalarlo manualmente y quizás modificar la línea de ejecución :

**Instalarlo desde:** <http://gnuwin32.sourceforge.net/packages/wget.htm>

**MoB-API-and-MoB-Repository/mob_api.py (línea 258)**
```python
 subprocess.run('wget --no-check-certificate --warc-file='+mobEnvURL+str(id)+' --recursive --level=1 -O tempfile '+url, shell=True)
```

Modifica la línea de comando dependiendo de la forma en que ha instalado el wget o si se encuentra entre las variables del sistema. 

---
## Recuerde

Leer los readme de en cada uno de esos directorios para conocer más sobre ellos. 