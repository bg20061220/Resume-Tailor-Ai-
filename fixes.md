Changed database.py 
 After supabase outage there was a outage on my app as well even after the outage was fixed. 
 It was due to weak connection building logic in database.py 

 1) Added connect_timout = 10 so it doesn't hang on a dead connection 
 2) added tcp keep alive settings to detect dropped connections faster
 3) Added a SELECT 1 ping after connecting to verify its actually live 
 4) Added a retry loop ( 3 attempts  , 1.5s apart) so a brief hiccup doesn't fail. 


 chanegs in experineces.py as well 
 Wrapped the whole thing in try/except — it had none before, so any DB error crashed silently with no useful message
Added print(f"[get_all_experiences] ERROR: {e}") so failures show up in Render logs
Fixed the finally block to safely close cur and conn even if they were never assigned (avoids a secondary NameError on failure)
Added a SELECT 1 ping before the actual query as an early check
