export interface IUser {
    onshapeId?: string,
    username: string
}

export interface IMongoDBUser {
    userId: string,
    username: string,
    emails: Array<string>,
    accessToken: string,
    refreshToken: string,
    __v: number,
    _id: string
}

export interface IOnshapeSession {
    onshapeId?: string,
    username: string,
    __v: number,
    _id: string
}