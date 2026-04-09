import {Injectable} from "@nestjs/common"
import {PassportStrategy} from "@nestjs/passport"
import {Strategy,Profile} from "passport-google-oauth20"

@Injectable()
export class GoogleStrategy  extends PassportStrategy(Strategy,"google"){
    constructor() {
        super({
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: process.env.GOOGLE_CALLBACK_URL!,
          scope: ["email", "profile"],
        })
      }
    
      validate(_accessToken: string, _refreshToken:string, profile:Profile){
        const emailRaw = profile.emails?.[0]?.value ?? null
        const email = emailRaw ? emailRaw.toLowerCase() : null

        return {
            provider:"google" as const,
            providerAccountId: profile.id,
            email,
            name: profile.displayName ?? email ?? "User",
            avatarUrl: profile.photos?.[0]?.value ?? null,
        }
      }
}