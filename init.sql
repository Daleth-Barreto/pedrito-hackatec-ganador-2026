--
-- PostgreSQL database dump
--

\restrict 30l56CF7tFRwZd1iUZNndpTVT26zsQOBLm8Rkh519qai7EpcsTi6OUYHm0zZElm

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO seguimiento;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.assignments (
    clinician_id character varying(36) NOT NULL,
    patient_id character varying(36) NOT NULL
);


ALTER TABLE public.assignments OWNER TO seguimiento;

--
-- Name: consents; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.consents (
    id character varying(36) NOT NULL,
    patient_id character varying(36) NOT NULL,
    version character varying(20) NOT NULL,
    accepted_at timestamp with time zone NOT NULL,
    accepted boolean DEFAULT true NOT NULL
);


ALTER TABLE public.consents OWNER TO seguimiento;

--
-- Name: privacy_requests; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.privacy_requests (
    id character varying(36) NOT NULL,
    patient_id character varying(36) NOT NULL,
    kind character varying(24) NOT NULL,
    details text NOT NULL,
    status character varying(24) NOT NULL,
    response text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.privacy_requests OWNER TO seguimiento;

--
-- Name: records; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.records (
    id character varying(36) NOT NULL,
    patient_id character varying(36) NOT NULL,
    consent_id character varying(36) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    questionnaire json NOT NULL,
    image_key character varying(40) NOT NULL,
    image_metadata json NOT NULL,
    inference json NOT NULL,
    priority character varying(16),
    reasons json NOT NULL,
    rules_version character varying(20) NOT NULL
);


ALTER TABLE public.records OWNER TO seguimiento;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.reviews (
    id character varying(36) NOT NULL,
    record_id character varying(36) NOT NULL,
    clinician_id character varying(36) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    assessment character varying(30) NOT NULL,
    note text NOT NULL
);


ALTER TABLE public.reviews OWNER TO seguimiento;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.sessions (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO seguimiento;

--
-- Name: users; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.users (
    id character varying(36) NOT NULL,
    email character varying(254) NOT NULL,
    name character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(16) NOT NULL,
    is_demo boolean NOT NULL
);


ALTER TABLE public.users OWNER TO seguimiento;

--
-- Name: visual_analyses; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.visual_analyses (
    record_id character varying(36) NOT NULL,
    consent_id character varying(36) NOT NULL,
    result json NOT NULL
);


ALTER TABLE public.visual_analyses OWNER TO seguimiento;

--
-- Name: visual_consents; Type: TABLE; Schema: public; Owner: seguimiento
--

CREATE TABLE public.visual_consents (
    id character varying(36) NOT NULL,
    record_id character varying(36) NOT NULL,
    accepted boolean NOT NULL,
    version character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.visual_consents OWNER TO seguimiento;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.alembic_version (version_num) FROM stdin;
0003
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.assignments (clinician_id, patient_id) FROM stdin;
\.


--
-- Data for Name: consents; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.consents (id, patient_id, version, accepted_at, accepted) FROM stdin;
\.


--
-- Data for Name: privacy_requests; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.privacy_requests (id, patient_id, kind, details, status, response, created_at, verified_at, updated_at) FROM stdin;
\.


--
-- Data for Name: records; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.records (id, patient_id, consent_id, created_at, expires_at, questionnaire, image_key, image_metadata, inference, priority, reasons, rules_version) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.reviews (id, record_id, clinician_id, created_at, assessment, note) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.sessions (id, user_id, expires_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.users (id, email, name, password_hash, role, is_demo) FROM stdin;
\.


--
-- Data for Name: visual_analyses; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.visual_analyses (record_id, consent_id, result) FROM stdin;
\.


--
-- Data for Name: visual_consents; Type: TABLE DATA; Schema: public; Owner: seguimiento
--

COPY public.visual_consents (id, record_id, accepted, version, created_at) FROM stdin;
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (clinician_id, patient_id);


--
-- Name: consents consents_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.consents
    ADD CONSTRAINT consents_pkey PRIMARY KEY (id);


--
-- Name: privacy_requests privacy_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.privacy_requests
    ADD CONSTRAINT privacy_requests_pkey PRIMARY KEY (id);


--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_record_id_key; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_record_id_key UNIQUE (record_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visual_analyses visual_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.visual_analyses
    ADD CONSTRAINT visual_analyses_pkey PRIMARY KEY (record_id);


--
-- Name: visual_consents visual_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.visual_consents
    ADD CONSTRAINT visual_consents_pkey PRIMARY KEY (id);


--
-- Name: ix_consents_patient_id; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_consents_patient_id ON public.consents USING btree (patient_id);


--
-- Name: ix_privacy_requests_patient_id; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_privacy_requests_patient_id ON public.privacy_requests USING btree (patient_id);


--
-- Name: ix_records_created_at; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_records_created_at ON public.records USING btree (created_at);


--
-- Name: ix_records_expires_at; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_records_expires_at ON public.records USING btree (expires_at);


--
-- Name: ix_records_patient_id; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_records_patient_id ON public.records USING btree (patient_id);


--
-- Name: ix_records_priority; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_records_priority ON public.records USING btree (priority);


--
-- Name: ix_sessions_user_id; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: ix_visual_consents_record_id; Type: INDEX; Schema: public; Owner: seguimiento
--

CREATE INDEX ix_visual_consents_record_id ON public.visual_consents USING btree (record_id);


--
-- Name: assignments assignments_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.users(id);


--
-- Name: assignments assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id);


--
-- Name: consents consents_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.consents
    ADD CONSTRAINT consents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id);


--
-- Name: privacy_requests privacy_requests_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.privacy_requests
    ADD CONSTRAINT privacy_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id);


--
-- Name: records records_consent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES public.consents(id);


--
-- Name: records records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_clinician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_clinician_id_fkey FOREIGN KEY (clinician_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: visual_analyses visual_analyses_consent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.visual_analyses
    ADD CONSTRAINT visual_analyses_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES public.visual_consents(id) ON DELETE CASCADE;


--
-- Name: visual_analyses visual_analyses_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.visual_analyses
    ADD CONSTRAINT visual_analyses_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id) ON DELETE CASCADE;


--
-- Name: visual_consents visual_consents_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguimiento
--

ALTER TABLE ONLY public.visual_consents
    ADD CONSTRAINT visual_consents_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id) ON DELETE CASCADE;

-- Registros de prueba limpios para evitar errores de encriptación en el backend
INSERT INTO public.users (id, email, name, password_hash, role, is_demo) VALUES 
('a3750e9d-f047-4306-af9d-c7e9f8e701fe', 'maria@test.com', 'Maria', '$argon2id$v=19$m=65536,t=3,p=4$iTXplCOXCIuOl218//+f6g$bWMiIh0V9PqhuKwCe1fWQWWEo9schzpboeguBJvqz6A', 'patient', true),
('8e93da88-eecc-44db-8688-22d18a99e915', 'salud@demo.local', 'salud', '$argon2id$v=19$m=65536,t=3,p=4$DtCLApFJiaT1t6X5id5jyg$lgjpDvcuRCeKitfmaaUCcb1tri5nXLpgcgoJC1sKD08', 'clinician', true),
('329f3285-25cf-4564-8d7a-35d9dc3911c3', 'paciente@demo.local', 'paciente', '$argon2id$v=19$m=65536,t=3,p=4$IHUoIoFlRqPZnrBaluWMsA$5780xOkijI/Y3/1EcMXR3ChLyk6f7VfbD/QqmI8ZEgk', 'patient', false),
('9764c068-b283-4af2-b665-9f44b0b5d864', 'otro@demo.local', 'otro', '$argon2id$v=19$m=65536,t=3,p=4$kVQsk/TuLBjxyBe3/lfI2g$81qhKe7C9JxAPzmEj+UnNQCi3cuY1J7koU22KMeTfOE', 'patient', true);


--
-- PostgreSQL database dump complete
--

\unrestrict 30l56CF7tFRwZd1iUZNndpTVT26zsQOBLm8Rkh519qai7EpcsTi6OUYHm0zZElm

