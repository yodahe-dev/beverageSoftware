This is the frontend .env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

and this is Backend env

# PostgreSQL for Neon (used in production)
DATABASE_URL="postgresql://neondb_owner:npg_EP8XogTCIv0w@ep-cold-darkness-adz8dlig-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# App port
PORT=8000

# Email credentials (do not commit this to GitHub!)
EMAIL_USER=yodijone@gmail.com
EMAIL_PASS=tyvqqpxzhxrifbus

# For encrypting sensitive data (must be 32 characters)
ENCRYPTION_KEY=12345678901234567890123456789012

# MySQL fallback (not used in current project)
DB_NAME=BevFlow
DB_USER=root
DB_PASS=
DB_HOST=127.0.0.1
DB_DIALECT=mysql

# Important for CORS (mobile + web)
# Use IP for mobile, localhost for web
# CLIENT_URL=http://192.168.0.6:8081,http://localhost:8081
# CLIENT_URL=http://127.0.0.1:5500
CLIENT_URL=http://localhost:3000


# For reference (not used by server code directly)
backendurl=http://192.168.0.6:8000

# JWT secret key
JWT_SECRET=K3u9@92#nfU^88Qf!$kFmvZpLqI4bRt

# Firebase credentials (used for cloud messaging/storage)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=plusme-3ad39
FIREBASE_PRIVATE_KEY_ID=81f8ff35e72356517919d4a237e20c8347267dc5
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9...snip...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@plusme-3ad39.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=116948227628926176259
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40plusme-3ad39.iam.gserviceaccount.com
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
FIREBASE_STORAGE_BUCKET=plusme-3ad39.appspot.com
