class Singleton(type):
    """
    Metaclass permettant de créer une classe singleton
    Elle s'assure qu'il n'y a qu'une seule instance de la classe

    Une Metaclass est une classe qui définit comment une classe est créée, elle est appelée lorsque la classe est créée
    """
    _instances = {}
    # lorsque la metaclass est appelée
    def __call__(cls, *args, **kwargs): # cls = Nom de la classe, *args = liste des arguments, **kwargs = liste des arguments nommés
        if cls not in Singleton._instances:
            Singleton._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return Singleton._instances[cls]