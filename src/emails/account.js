const sgMail = require('@sendgrid/mail')

const apiKey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(apiKey)

const htmlWelcomeMsg =
  '<div style="margin: 20px"> <h1>Hello.</h1>  <div style="background-color: whitesmoke; box-shadow: black 1px 1px 1px; height: 100px; padding: 30px; margin-top:20px;"> <p>I\'m sure you can\'t wait to make tasks!</p> </div> </div>'

const htmlCancelationMsg =
  '<div style="margin: 20px"> <h1>Is there anything that we could\'ve done better?</h1> <div style="background-color: whitesmoke; box-shadow: black 1px 1px 1px; height: auto; padding: 30px; margin-top:20px;"> <p style="margin-bottom:30px;">Please write your suggestions here:</p> <form><textarea name="reason" placeholder="Write something.." style="height:100px; width: 100%"> </textarea> </form> </div> </div>'

const sendWelcomeEmail = async ({email, name}) => {
  try {
    await sgMail.send({
      to: email,
      from: 'ethancannelongo@gmail.com',
      subject: `We're glad to have you on board, ${name}`,
      html: htmlWelcomeMsg,
    })
  } catch (error) {
    throw new Error('Unable to send email')
  }
}

const sendCancelationEmail = async ({email, name}) => {
  try {
    await sgMail.send({
      to: email,
      from: 'ethancannelongo@gmail.com',
      subject: `We hate to see you go, ${name}`,
      html: htmlCancelationMsg,
    })
  } catch (error) {
    throw new Error('Unable to send email')
  }
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
}
