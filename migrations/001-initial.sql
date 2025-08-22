CREATE TABLE branches (
    branch_id INTEGER PRIMARY KEY,
    id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,

    CONSTRAINT id CHECK (substr(id, 1, 5) == 'bran_')
);

CREATE TABLE branch_user_join (
    branch_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL
);

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    id TEXT NOT NULL UNIQUE, 
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT,
    
    CONSTRAINT id CHECK (substr(id, 1, 5) == 'user_')
);

CREATE TABLE forms (
    form_id INTEGER PRIMARY KEY,
    id TEXT NOT NULL UNIQUE,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,

    CONSTRAINT id CHECK (substr(id, 1, 5) == 'form_')
);

CREATE TABLE property (
    property_id INTEGER PRIMARY KEY,
    id TEXT NOT NULL UNIQUE,
    address TEXT,

    CONSTRAINT id CHECK (substr(id, 1, 5) == 'prop_')
);

CREATE TABLE responses (
    response_id INTEGER PRIMARY KEY,
    id TEXT NOT NULL UNIQUE,
    form_data TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    submitted INTEGER DEFAULT (unixepoch()),

    CONSTRAINT id CHECK (substr(id, 1, 5) == 'resp_')
);