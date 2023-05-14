from enum import Enum
from typing import Optional

def trigger_for_log(table_name : str) -> list[str]:
    """
    Génère les triggers de log pour une table donnée

    Obligé de le faire comme ça car les triggers en mysql ne peuvent pas s'activer sur plusieurs types d'événements différents
    """
    return [
        f"""
        CREATE OR REPLACE TRIGGER log_{type[0]}_trigger_{table_name} AFTER {type[0]} ON {table_name}
        FOR EACH ROW
        BEGIN
            CALL insert_log("{type[0]}", USER(), "{table_name}", "{type[1]} d'une ligne dans la table {table_name}");
        END;
        """ for type in [("INSERT", "Insertion"), ("UPDATE", "Mise à jour"), ("DELETE", "Suppression")]
    ]

class TABLES(Enum):
    """
    Enumération des tables de la base de données (sans la table de log qui est gérée différemment)
    Permet de créer les tables de la base de données et de vérifier leur existence

    Structure d'une table:
    - name: nom de la table
    - columns: liste des colonnes de la table, format (nom, type, estCléPrimaire, (optionnel))
    - foreign_key (optionnel): liste des clés étrangères de la tablen ajoutées à la fin de la requête de création de la table
    - bonuses (optionnel): liste des contraintes de la tablen ajoutées à la fin de la requête de création de la table
    - triggers (optionnel): liste des triggers de la table, format SQL, les élements de la liste sont éxécutés dans l'ordre après la création de la table
    """
    station_information = {
        "columns": [
            ("stationcode", "VARCHAR(20)", True),
            ("name", "VARCHAR(255)"),
            ("capacity", "INT"),
            ("coordonnees_geo", "POINT"),
            ("nom_arrondissement_communes", "VARCHAR(255)")
        ],
        "triggers": [
            *trigger_for_log("station_information")
        ]
        
    }
    station_status = {
        "columns": [
            ("date", "DATETIME"),
            ("stationcode", "VARCHAR(20)", ),
            ("is_installed", "VARCHAR(3)"),
            ("numdocksavailable", "INT"),
            ("numbikesavailable", "INT"),
            ("mechanical", "INT"),
            ("ebike", "INT")
        ],
        "foreign_key": [
            # (nom_clé_origin, nom_table_ref, non_clé_table_ref, on_delete, on_update)
            ("stationcode", "station_information", "stationcode", "CASCADE", "CASCADE")
        ],
        "bonuses": [
            "PRIMARY KEY (stationcode, date)"
        ],
        "triggers": [
            *[f"""
            CREATE OR REPLACE TRIGGER station_status_{type}_trigger BEFORE {type} ON station_status
            FOR EACH ROW
            BEGIN
                IF NEW.is_installed != "OUI" AND NEW.is_installed != "NON" THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Données invalide : is_installed doit être égal à OUI ou NON';
                END IF;

                IF NEW.mechanical + NEW.ebike != NEW.numbikesavailable THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Données invalide : mechanical + ebike doit être égal à numbikesavailable';
                END IF;
                
            END
            """ for type in ["INSERT", "UPDATE"]],
            *trigger_for_log("station_status")
        ]
    }

    @property
    def columns(self) -> list[tuple[str, str]]:
        return self.value["columns"]
    
    @property
    def foreign_keys(self) -> list[tuple[str, str, str, Optional[str], Optional[str]]]:
        return self.value["foreign_key"] if "foreign_key" in self.value else None
    
    @property
    def bonuses(self) -> list[str]:
        return self.value["bonuses"] if "bonuses" in self.value else None
    
    @property
    def triggers(self) -> list[str]:
        return self.value["triggers"] if "triggers" in self.value else None


log_table = {
    "name": "history_change",
    "columns": [
            ("DATE", "DATETIME"),
            ("USER", "VARCHAR(50)"),
            ("TYPE", "VARCHAR(50)"),
            ("TABLE_AFFECTED", "VARCHAR(50)"),
            ("MSG", "VARCHAR(255)")
    ],
    "triggers": [
        """
        CREATE OR REPLACE PROCEDURE insert_log (IN type VARCHAR(50), IN user VARCHAR(50), IN table_affected VARCHAR(50), IN msg VARCHAR(255))
        BEGIN
            INSERT INTO history_change (DATE, USER, TYPE, TABLE_AFFECTED, MSG) VALUES (NOW(), user, type, table_affected, msg);
        END
        """
    ] 
}

def build_table_query(table_name: str, columns: list[tuple], foreign_keys:(None | list[tuple[str, str, str, Optional[str], Optional[str]]])=None, bonuses:(None | list[str])=None) -> str:
        """
        Construit la requête de création de la table
        """
        query = "CREATE TABLE " + table_name + " ("

        columns_list_str = []
        for column in columns:
            columns_str = column[0] + " " + column[1] + " NOT NULL"

            if(len(column) > 2 and column[2]):
                columns_str += " PRIMARY KEY"

            columns_list_str.append(columns_str)

        if(foreign_keys != None):
            for foreign_key in foreign_keys:
                columns_str = f"CONSTRAINT `fk_{foreign_key[0]}` "
                columns_str += f"FOREIGN KEY ({foreign_key[0]}) " 
                columns_str += f"REFERENCES {foreign_key[1]} ({foreign_key[2]}) "
                columns_str += f"ON DELETE {foreign_key[3] if len(foreign_key) > 2 else 'RESTRICT' } "
                columns_str += f"ON UPDATE {foreign_key[4] if len(foreign_key) > 3 else 'RESTRICT'}"
                columns_list_str.append(columns_str)
        
        if bonuses != None:
            for bonus in bonuses:
                columns_list_str.append(bonus)
        
        query += ", ".join(columns_list_str)
        query += ");"

        return query