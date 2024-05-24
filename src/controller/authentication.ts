import express from 'express'
import { IOtp, IUser } from 'types/user'

import {
   addOtpModel,
   getOtpByMobileNumberModel,
   verifyOtpModel,
} from '../models/otp'
import {
   createUserIfNotExistsModel,
   getUserByuseridModel,
   updateUserProfileModel,
} from '../models/user'
import passport from '../services/passport'
import { generateJWT } from '../utils/auth'

/**
 * Get self user data from token
 * @param req : -
 * @param res : user
 * @returns
 */
export const getSelfController = async (
   req: express.Request,
   res: express.Response,
) => {
   try {
      const { userid } = res.locals
      const user = await getUserByuseridModel(userid)
      if (!user) {
         res.clearCookie('OG-AUTH')
         return res.status(404).json({ message: 'User not found' })
      }
      return res.status(200).json({
         message: 'User found',
         data: user,
      })
   } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
   }
}

/**
 * Send OTP for Sign in or Sign up
 * @param req : mobile, country_code
 * @param res : message, data
 * @returns
 */
export const sendOTPController = async (
   req: express.Request,
   res: express.Response,
) => {
   try {
      const { mobile, country_code } = req.body
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expires_at = new Date(Date.now() + 6000000) // 10 minutes

      const otpData: IOtp = {
         mobile,
         country_code,
         expires_at,
         otp,
      }

      await addOtpModel(otpData)
      return res.status(200).json({
         message: 'OTP sent successfully',
         data: {
            otp,
            mobile,
            country_code,
            expires_at,
         },
      })
   } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
   }
}

/**
 * Verify OTP for Sign in or Sign up
 * @param req : mobile, otp
 * @param res : message
 * @returns
 */
export const verifyOTPController = async (
   req: express.Request,
   res: express.Response,
) => {
   try {
      const { mobile, otp } = req.body
      const otpData = await getOtpByMobileNumberModel(mobile as number, otp)
      if (!otpData) {
         return res.status(404).json({ message: 'OTP not found' })
      }

      if (otpData.otp !== otp) {
         return res.status(401).json({ message: 'Invalid OTP' })
      }

      if (otpData.expires_at < new Date() || otpData.is_verified) {
         return res.status(401).json({ message: 'OTP expired' })
      }

      await verifyOtpModel(mobile as number, otp)
      const userData = await createUserIfNotExistsModel(mobile as number)
      const payload = {
         userid: userData.userid,
      }
      const token = await generateJWT(payload)
      res.cookie('OG-AUTH', token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
      })

      return res.status(200).json({
         message: 'OTP verified successfully',
         data: userData,
      })
   } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
   }
}

/**
 * Update user details
 * @param req : username, email, firstname, lastname, role, profile_picture, bio
 * @param res : message
 * @returns
 */
export const updateUserDetailsController = async (
   req: express.Request,
   res: express.Response,
) => {
   try {
      const { userid } = res.locals
      const { username, email, firstname, lastname, profile_picture, bio } =
         req.body

      await updateUserProfileModel(userid, {
         username,
         email,
         firstname,
         lastname,
         profile_picture,
         is_email_verified: false,
         is_profile_completed: true,
         bio,
      })

      return res
         .status(200)
         .json({ message: 'User details updated successfully' })
   } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
   }
}

/**
 * Logout a user
 * @param req : token
 * @param res : message
 * @returns
 */
export const logoutController = async (
   req: express.Request,
   res: express.Response,
) => {
   try {
      const token = req.cookies['OG-AUTH']

      if (!token) {
         return res.status(401).json({
            message: 'Unauthorized: No session token',
         })
      }

      res.clearCookie('OG-AUTH')
      return res.redirect('http://localhost:3000/')
   } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
   }
}

/**
 * Google authentication
 * @param req : -
 * @param res : -
 * @returns
 * @description
 * 1. Authenticate user with google
 * */
export const googleAuthController = passport.authenticate('google', {
   scope: ['profile', 'email'],
})

/**
 * Callback for google authentication
 * @param req : token
 * @param res : message, user
 * @returns
 * @description
 * 1. Authenticate user with google
 * 2. If user exists, generate JWT and set cookie
 * 3. If user does not exist, create user, generate JWT and set cookie
 * 4. Redirect to client url
 * */
export const googleAuthCallbackController = (
   req: express.Request,
   res: express.Response,
) => {
   passport.authenticate('google', async (err: Error, user: IUser) => {
      if (err) {
         console.error(err)
         return res
            .status(401)
            .json({ message: 'Google authentication failed' })
      }
      if (!user) {
         console.error('User not found')
         return res
            .status(401)
            .json({ message: 'Google authentication failed' })
      }

      const payload = {
         userid: user.userid,
      }

      const token = await generateJWT(payload)

      res.cookie('OG-AUTH', token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
      })

      return res.status(200).redirect(`${process.env.CLIENT_URL}`)
   })(req, res)
}
