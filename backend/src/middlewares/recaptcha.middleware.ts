import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import config from '../config/env.config';

export async function verifyRecaptcha(req: Request, res: Response, next: NextFunction) {
    if(!config.isCheckRecaptcha)
    {
        return next();
    }
    const token = req.body['g-recaptcha-response'];
    if (!token) {
      return res.status(400).json({ message: 'reCAPTCHA token is missing.' });
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: config.recaptchaSecretKey,
            response: token,
          },
        }
      );
      const { success } = response.data;
      console.log('reCAPTCHA response:', response.data);
      if (!success) {
        return res.status(400).json({ message: 'Failed reCAPTCHA validation.' });
      }
      next();
    } catch (err) {
      console.error('reCAPTCHA error:', err);
      return res.status(500).json({ message: 'reCAPTCHA validation failed (server error).' });
    }
  }