import { Module, Global, DynamicModule, Provider } from "@nestjs/common";
import { Database } from "arangojs";
import { Config } from "arangojs/lib/cjs/connection";

interface DatabaseConnection {
  options?: Config,
  url: string,
  database: string,
  user: string,
  password: string
}

type DatabaseConnections = Record<string,DatabaseConnection>

interface DatabaseModuleOptions {
  database: DatabaseConnections
}

@Global()
@Module({})
export class DatabaseModule {
  static configure ({ database }: DatabaseModuleOptions = {
    database: {
      default: {
        database: process.env.ARANGODB_DATABASE,
        url: process.env.ARANGODB_URL,
        user: process.env.ARANGODB_USER,
        password: process.env.ARANGODB_PASSWORD,
      }
    }
  }) : DynamicModule {
    const databases = Object.keys(database).map<Provider>(name => {
      const { url, database:db, options = {}, password, user } = database[name]
      console.log(url, db, user, password)
      const DB = new Database({
        url,
        ...options as Object
      });

      DB.useDatabase(db);
      DB.useBasicAuth(user, password);
      
      return {
        provide: `ARANGO_DB#${name}`,
        useValue: DB,
      }
    })

    return {
      module: this,
      providers: databases,
      exports: databases
    }
  }
}