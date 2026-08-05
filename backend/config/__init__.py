try:
    import pymysql  # type: ignore
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

