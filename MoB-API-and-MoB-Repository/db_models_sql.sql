--
-- PostgreSQL database dump
--

-- Dumped from database version 10.1
-- Dumped by pg_dump version 10.1

-- Started on 2018-05-02 18:43:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE mob_geodb;
--
-- TOC entry 5049 (class 1262 OID 16393)
-- Name: mob_geodb; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE mob_geodb WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'English_United States.1252' LC_CTYPE = 'English_United States.1252';


ALTER DATABASE mob_geodb OWNER TO postgres;

\connect mob_geodb

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 19 (class 2615 OID 18371)
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- TOC entry 20 (class 2615 OID 18641)
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- TOC entry 18 (class 2615 OID 18089)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 18
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 1 (class 3079 OID 12924)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- TOC entry 7 (class 3079 OID 18231)
-- Name: address_standardizer; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS address_standardizer WITH SCHEMA public;


--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 7
-- Name: EXTENSION address_standardizer; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION address_standardizer IS 'Used to parse an address into constituent elements. Generally used to support geocoding address normalization step.';


--
-- TOC entry 2 (class 3079 OID 18360)
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- TOC entry 3 (class 3079 OID 18356)
-- Name: ogr_fdw; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS ogr_fdw WITH SCHEMA public;


--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION ogr_fdw; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ogr_fdw IS 'foreign-data wrapper for GIS data access';


--
-- TOC entry 9 (class 3079 OID 16394)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 9
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- TOC entry 8 (class 3079 OID 17893)
-- Name: pgrouting; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS pgrouting WITH SCHEMA public;


--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 8
-- Name: EXTENSION pgrouting; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgrouting IS 'pgRouting Extension';


--
-- TOC entry 5 (class 3079 OID 18256)
-- Name: pointcloud; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS pointcloud WITH SCHEMA public;


--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION pointcloud; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pointcloud IS 'data type for lidar point clouds';


--
-- TOC entry 4 (class 3079 OID 18346)
-- Name: pointcloud_postgis; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS pointcloud_postgis WITH SCHEMA public;


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pointcloud_postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pointcloud_postgis IS 'integration for pointcloud LIDAR data and PostGIS geometry data';


--
-- TOC entry 6 (class 3079 OID 18238)
-- Name: postgis_sfcgal; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS postgis_sfcgal WITH SCHEMA public;


--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION postgis_sfcgal; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_sfcgal IS 'PostGIS SFCGAL functions';


--
-- TOC entry 11 (class 3079 OID 18372)
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 11
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- TOC entry 10 (class 3079 OID 18090)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 10
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 287 (class 1259 OID 18816)
-- Name: general_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE general_users (
    id_user integer NOT NULL,
    username character varying(20) NOT NULL,
    password character varying NOT NULL,
    name character varying(20),
    lastname character varying(20),
    email character varying(30) NOT NULL,
    active integer DEFAULT 0,
    rol integer DEFAULT 0
);


ALTER TABLE general_users OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 32770)
-- Name: general_users_activation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE general_users_activation (
    id_activation integer NOT NULL,
    id_user integer,
    hash uuid
);


ALTER TABLE general_users_activation OWNER TO postgres;

--
-- TOC entry 298 (class 1259 OID 40977)
-- Name: general_users_rols; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE general_users_rols (
    id_user_rol integer NOT NULL,
    name character varying NOT NULL,
    description character varying
);


ALTER TABLE general_users_rols OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 40975)
-- Name: general_users_rols_id_user_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE general_users_rols_id_user_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE general_users_rols_id_user_rol_seq OWNER TO postgres;

--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 297
-- Name: general_users_rols_id_user_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE general_users_rols_id_user_rol_seq OWNED BY general_users_rols.id_user_rol;


--
-- TOC entry 302 (class 1259 OID 41002)
-- Name: mob_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE mob_collections (
    id_collection integer NOT NULL,
    name character varying,
    categories text
);


ALTER TABLE mob_collections OWNER TO postgres;

--
-- TOC entry 301 (class 1259 OID 41000)
-- Name: mob_collections_id_collection_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE mob_collections_id_collection_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE mob_collections_id_collection_seq OWNER TO postgres;

--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 301
-- Name: mob_collections_id_collection_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE mob_collections_id_collection_seq OWNED BY mob_collections.id_collection;


--
-- TOC entry 291 (class 1259 OID 24599)
-- Name: mob_segmentation_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE mob_segmentation_details (
    id_details integer NOT NULL,
    mob_score integer,
    mob_blocks json,
    mob_html text,
    mob_date character varying,
    mob_browser character varying,
    mob_gran integer,
    id_web_page integer,
    id_user integer,
    seg_type character varying,
    mob_status character varying DEFAULT 'scoring'::character varying
);


ALTER TABLE mob_segmentation_details OWNER TO postgres;

--
-- TOC entry 294 (class 1259 OID 24613)
-- Name: mob_segmentation_geo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE mob_segmentation_geo (
    id_geo integer NOT NULL,
    id_details integer NOT NULL,
    tag character varying,
    block geometry(LineString),
    block_id character varying,
    words integer,
    elems integer,
    score_geo integer,
    score_sem integer,
    identifier integer,
    dom json,
    gran integer
);


ALTER TABLE mob_segmentation_geo OWNER TO postgres;

--
-- TOC entry 300 (class 1259 OID 40991)
-- Name: mob_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE mob_tags (
    id_tag integer NOT NULL,
    name character varying,
    desc_esp text,
    desc_eng text,
    desc_fra text
);


ALTER TABLE mob_tags OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 40989)
-- Name: mob_tags_id_tag_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE mob_tags_id_tag_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE mob_tags_id_tag_seq OWNER TO postgres;

--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 299
-- Name: mob_tags_id_tag_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE mob_tags_id_tag_seq OWNED BY mob_tags.id_tag;


--
-- TOC entry 295 (class 1259 OID 32768)
-- Name: mob_user_activation_id_activation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE mob_user_activation_id_activation_seq
    AS integer
    START WITH 1
    INCREMENT BY 3
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE mob_user_activation_id_activation_seq OWNER TO postgres;

--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 295
-- Name: mob_user_activation_id_activation_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE mob_user_activation_id_activation_seq OWNED BY general_users_activation.id_activation;


--
-- TOC entry 289 (class 1259 OID 18825)
-- Name: mob_web_page; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE mob_web_page (
    id_web_page integer NOT NULL,
    title character varying,
    url character varying,
    collection character varying,
    category character varying,
    width integer,
    height integer,
    capture text
);


ALTER TABLE mob_web_page OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 24595)
-- Name: segmentation_details_id_details_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE segmentation_details_id_details_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE segmentation_details_id_details_seq OWNER TO postgres;

--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 290
-- Name: segmentation_details_id_details_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE segmentation_details_id_details_seq OWNED BY mob_segmentation_details.id_details;


--
-- TOC entry 293 (class 1259 OID 24611)
-- Name: segmentation_geo_id_details_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE segmentation_geo_id_details_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE segmentation_geo_id_details_seq OWNER TO postgres;

--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 293
-- Name: segmentation_geo_id_details_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE segmentation_geo_id_details_seq OWNED BY mob_segmentation_geo.id_details;


--
-- TOC entry 292 (class 1259 OID 24609)
-- Name: segmentation_geo_id_geo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE segmentation_geo_id_geo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE segmentation_geo_id_geo_seq OWNER TO postgres;

--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 292
-- Name: segmentation_geo_id_geo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE segmentation_geo_id_geo_seq OWNED BY mob_segmentation_geo.id_geo;


--
-- TOC entry 286 (class 1259 OID 18814)
-- Name: user_id_user_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_id_user_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_user_seq OWNER TO postgres;

--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 286
-- Name: user_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_id_user_seq OWNED BY general_users.id_user;


--
-- TOC entry 288 (class 1259 OID 18823)
-- Name: web_page_id_web_page_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE web_page_id_web_page_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE web_page_id_web_page_seq OWNER TO postgres;

--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 288
-- Name: web_page_id_web_page_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE web_page_id_web_page_seq OWNED BY mob_web_page.id_web_page;


--
-- TOC entry 4887 (class 2604 OID 18819)
-- Name: general_users id_user; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY general_users ALTER COLUMN id_user SET DEFAULT nextval('user_id_user_seq'::regclass);


--
-- TOC entry 4895 (class 2604 OID 32773)
-- Name: general_users_activation id_activation; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY general_users_activation ALTER COLUMN id_activation SET DEFAULT nextval('mob_user_activation_id_activation_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 40980)
-- Name: general_users_rols id_user_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY general_users_rols ALTER COLUMN id_user_rol SET DEFAULT nextval('general_users_rols_id_user_rol_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 41005)
-- Name: mob_collections id_collection; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_collections ALTER COLUMN id_collection SET DEFAULT nextval('mob_collections_id_collection_seq'::regclass);


--
-- TOC entry 4891 (class 2604 OID 24602)
-- Name: mob_segmentation_details id_details; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_segmentation_details ALTER COLUMN id_details SET DEFAULT nextval('segmentation_details_id_details_seq'::regclass);


--
-- TOC entry 4893 (class 2604 OID 24616)
-- Name: mob_segmentation_geo id_geo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_segmentation_geo ALTER COLUMN id_geo SET DEFAULT nextval('segmentation_geo_id_geo_seq'::regclass);


--
-- TOC entry 4894 (class 2604 OID 24617)
-- Name: mob_segmentation_geo id_details; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_segmentation_geo ALTER COLUMN id_details SET DEFAULT nextval('segmentation_geo_id_details_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 40994)
-- Name: mob_tags id_tag; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_tags ALTER COLUMN id_tag SET DEFAULT nextval('mob_tags_id_tag_seq'::regclass);


--
-- TOC entry 4890 (class 2604 OID 18828)
-- Name: mob_web_page id_web_page; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_web_page ALTER COLUMN id_web_page SET DEFAULT nextval('web_page_id_web_page_seq'::regclass);


--
-- TOC entry 4910 (class 2606 OID 40985)
-- Name: general_users_rols general_users_rols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY general_users_rols
    ADD CONSTRAINT general_users_rols_pkey PRIMARY KEY (id_user_rol);


--
-- TOC entry 4914 (class 2606 OID 41010)
-- Name: mob_collections mob_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_collections
    ADD CONSTRAINT mob_collections_pkey PRIMARY KEY (id_collection);


--
-- TOC entry 4912 (class 2606 OID 40999)
-- Name: mob_tags mob_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_tags
    ADD CONSTRAINT mob_tags_pkey PRIMARY KEY (id_tag);


--
-- TOC entry 4908 (class 2606 OID 32775)
-- Name: general_users_activation mob_user_activation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY general_users_activation
    ADD CONSTRAINT mob_user_activation_pkey PRIMARY KEY (id_activation);


--
-- TOC entry 4904 (class 2606 OID 24608)
-- Name: mob_segmentation_details segmentation_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_segmentation_details
    ADD CONSTRAINT segmentation_details_pkey PRIMARY KEY (id_details);


--
-- TOC entry 4906 (class 2606 OID 24622)
-- Name: mob_segmentation_geo segmentation_geo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_segmentation_geo
    ADD CONSTRAINT segmentation_geo_pkey PRIMARY KEY (id_geo);


--
-- TOC entry 4900 (class 2606 OID 18822)
-- Name: general_users user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY general_users
    ADD CONSTRAINT user_pkey PRIMARY KEY (id_user);


--
-- TOC entry 4902 (class 2606 OID 18833)
-- Name: mob_web_page web_page_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_web_page
    ADD CONSTRAINT web_page_pkey PRIMARY KEY (id_web_page);


--
-- TOC entry 4915 (class 2606 OID 24628)
-- Name: mob_segmentation_geo segmentation_geo_id_details_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mob_segmentation_geo
    ADD CONSTRAINT segmentation_geo_id_details_fkey FOREIGN KEY (id_details) REFERENCES mob_segmentation_details(id_details) ON DELETE CASCADE;


--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 16
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2018-05-02 18:43:26

--
-- PostgreSQL database dump complete
--

