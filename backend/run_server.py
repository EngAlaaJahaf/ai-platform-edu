import uvicorn
from backend.main import app
from backend.config import PORT

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT, access_log=False)
