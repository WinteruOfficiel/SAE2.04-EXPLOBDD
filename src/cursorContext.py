class cursorContext:
    """
    Cette classe permet d'utiliser le pattern context manager pour les curseurs
    Elle permet d'ouvrir un curseur et de le fermer automatiquement à la fin de l'utilisation 

    Permet d'éviter d'oublier de fermer le curseur
    """

    def __init__(self, db):
        """
        Constructeur de la classe, prend en paramètre la base de donnée
        """
        self.db = db
        self._cursor = None

    def __enter__(self):
        """
        Cette fonction est appelée lorsque l'on entre dans le contexte
        Elle ouvre le curseur
        """
        self._cursor = self.db.cursor()
        return self._cursor
    
    def __exit__(self, exc_type, exc_value, traceback):
        """
        Cette fonction est appelée lorsque l'on sort du contexte
        Elle ferme le curseur
        """
        self._cursor.close()