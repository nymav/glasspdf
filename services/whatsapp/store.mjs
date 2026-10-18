import pg from 'pg';
export class Store{
 constructor(url){this.pool=new pg.Pool({connectionString:url,max:3,options:'-c timezone=UTC'});}
 async init(){await this.pool.query(`CREATE TABLE IF NOT EXISTS glasspdf_messages(id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());CREATE TABLE IF NOT EXISTS glasspdf_usage(account text NOT NULL,day date NOT NULL DEFAULT CURRENT_DATE,used integer NOT NULL DEFAULT 0,PRIMARY KEY(account,day));CREATE TABLE IF NOT EXISTS glasspdf_budget(day date PRIMARY KEY DEFAULT CURRENT_DATE,spent bigint NOT NULL DEFAULT 0,sent integer NOT NULL DEFAULT 0);`);}
 async claim(id){const r=await this.pool.query('INSERT INTO glasspdf_messages(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id',[id]);return r.rowCount===1;}
 async reserve(account){const r=await this.pool.query(`INSERT INTO glasspdf_usage(account,used) VALUES($1,1) ON CONFLICT(account,day) DO UPDATE SET used=glasspdf_usage.used+1 WHERE glasspdf_usage.used<5 RETURNING used`,[account]);return r.rowCount===1;}
 async refund(account){await this.pool.query('UPDATE glasspdf_usage SET used=GREATEST(0,used-1) WHERE account=$1 AND day=CURRENT_DATE',[account]);}
 async budget(cost,limit){const r=await this.pool.query(`INSERT INTO glasspdf_budget(day,spent,sent) SELECT CURRENT_DATE,$1::bigint,1 WHERE $1::bigint<=$2::bigint ON CONFLICT(day) DO UPDATE SET spent=glasspdf_budget.spent+$1::bigint,sent=glasspdf_budget.sent+1 WHERE glasspdf_budget.spent+$1::bigint<=$2::bigint AND glasspdf_budget.sent<500 RETURNING spent`,[cost,limit]);return r.rowCount===1;}
 async cleanup(){await this.pool.query("DELETE FROM glasspdf_messages WHERE created_at<now()-interval '7 days';DELETE FROM glasspdf_usage WHERE day<CURRENT_DATE-7;DELETE FROM glasspdf_budget WHERE day<CURRENT_DATE-7");}
}
