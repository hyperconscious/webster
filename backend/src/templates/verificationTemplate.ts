const verificationTemplate = (verificationLink: string): string => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
      body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
          color: #333;
      }
      .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          text-align: center;
      }
      h1 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #333;
      }
      p {
          font-size: 16px;
          color: #555;
          line-height: 1.6;
      }
      .button {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          font-size: 16px;
          color: #fff !important;
          background-color: #007bff;
          border: none;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: background-color 0.3s;
      }
      .button:hover {
          background-color: #0056b3;
      }
    </style>
  </head>
  <body>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center">
          <div class="container">
            <h1>Email Verification</h1>
            <p>Please verify your email by clicking the button below:</p>
            <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjRhMnIwcWg4dnMyc3ZtZjQ4N2x3bTZwamZ6b3B3ZjBxbTI0cHlobCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3orif6QfEsdl6hsg6s/giphy.gif"
             width="480" height="360" style="max-width: 100%; border-radius: 10px;" alt="Verefy gif" />
            <br>
            <a href="${verificationLink}" class="button">Verify Email</a>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export default verificationTemplate;
