export const mongoURI = process.env.MONGO_URI;
export const jwtSecret = process.env.JWT_SECRET;
export const jwtExpiration = process.env.JWT_EXPIRATION || '24h';
export const roles = {
    citizen: 'citizen',
    responder: 'responder',
    admin: 'admin'
};