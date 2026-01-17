import psycopg2 

try :
    conn = psycopg2.connect(
        host = "localhost",
        port = 5432 , 
        database = "resume_tailor",
        user = "postgres",
        password = "postgres"
    )
    print ("Connected to postgresSQL")
    conn.close() 
except Exception as e : 
    print (f"Connection Failed : {e}")