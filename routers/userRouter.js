import express from 'express'
import bcrypt from 'bcrypt'
import {User} from '../models/userModel.js'

const router = express.Router()
const SALT_ROUNDS = 8



router.use(express.json()) //this makes the json data available in the req.body parameter

router.param('userid', async function (req, res, next, userid)
{
    try
    {
        const user = await User.findById(userid)
        if (user)
        next()
        else
        res.status(400).send('Error')
    }
    catch(err)
    {
        res.status(400).send(`error message = ${err.message}`)
    }
})

//the following api function creates user.
router.post('/', async function(req, res)
{
    console.log(`req body = ${JSON.stringify(req.body)}`)
    if (!req.session || (req.body.is_admin && !req.session.authorized)) //the first condition ensures no error when the unauthorized user makes the request.
    return res.status(400).send('You are not authorized to create admin.')

    const full_name = req.body.full_name
    const email = req.body.email
    const ph_no = req.body.ph_no
    var password = req.body.password
    var confirm_password = req.body.confirm_password
    var is_admin = req.body.is_admin

    if(! confirm_password === password)
    return res.status(400).send('The two passwords do not match.')
    if (is_admin !== true)
    is_admin = false

    bcrypt.hash(password, SALT_ROUNDS, async function (err, hashed_password)
    {
        if (err)
        return res.status(500).send(err.message)
        else
        {
            if (full_name && email && hashed_password && ph_no)
            {
                try
                {
                    const user = new User({full_name: full_name, email: email, password: hashed_password, is_admin: is_admin, ph_no: ph_no})
                    await user.save()
                    return res.status(200).send('User created successfully.')
        
                }
                catch(err)
                {
                    return res.status(500).send(err.message)
        
                }
                
            }
            else
            return res.status(400).send('Enter all the details')

        }
    })
     

})

//update user profile
router.put('/:userid', async function (req, res)
{
    try
    {   
        //when one user tries to update the profile of the other user.
        if (req.params.userid !== req.session.user._id)    
        return res.status(401).send('You cant update the profile of other user')

        if (req.body.full_name && req.body.email && req.body.password && req.body.ph_no)
        await User.findByIdAndUpdate(req.params.userid, req.body)
        else
        return res.status(400).send('Enter all the details')
        
        return res.status(200).send('User updated successfully.')
    }

    catch(err)
    {
        return res.status(500).send(err.message)
    }


})

router.post('/login', async function (req, res)
{

    //see if the user is already logged in
    if (req.session.user)
    return res.status(400).send('You are already logged in. Please logout to log in to a different account.')
    //user can be logged in using either email or ph no
    const email_or_ph = req.body.email_or_ph
    const password = req.body.password
    if(email_or_ph.includes('@'))
    {
        try
        {
            var user = await User.find({email: email_or_ph})
            user = user[0]
            console.log(`user = ${user}`)

        }
        catch(err)
        {
            return res.status(400).send('Invalid email')
        }
        
    }
    else
    {
        try
        {
            var user = await User.find({ph_no: email_or_ph})
            user = user[0]
            // user = JSON.stringify(user)
            console.log(`user.name = ${user.full_name}`)
            console.log(`typeof user = ${typeof user}`)
        
        }
        catch(err)
        {
            return res.status(400).send('Invalid phone number')
        }
    }

    //once the email or phone number is determined check password
    try
    {
       
        bcrypt.compare(password, user.password, function(err, result)
        {
            if (err)
            {
                console.log(`erroruwa = ${err}`)
                console.log(`user.password  = ${user.password}`)
                console.log(`user.ph_no  = ${user['ph_no']}`)
                console.log(`user.email  = ${user['email']}`)
                console.log(`user = ${user}`)
                return res.status(400).send('Invalid password')
            }
            else
            {
                if (!result)
                return res.status(400).send('Incorrect password.')

                console.log(`result = ${result}`)
                req.session.user = user
                console.log(`req.session.user._id = ${req.session.user._id}`)
                if (user.is_admin)
                req.session.authorized = true
                return res.status(200).send('Login successful')

            }
        })

    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }

})


router.post('/logout', async function(req, res)
{
    if (req.session.user)
    {
        if (req.session.authorized)
        req.session.authorized = false
        req.session.user = false
        return res.status(200).send('Successfully logged out.')
    }
    else
    return res.status(400).send('User is not logged in to perform logout operation.')
})

//the following api function logs all the registered users.
router.get('/', async function(req, res)
{

    //check if the user/admin is loggedin
    if (!req.session.authorized)
    return res.status(401).send('Unauthorized access')
    try
    {
        const users = await User.find({}, '-password')
        return res.status(200).send(`registered users = ${users}`)
    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }
})

router.get('/view', function(req, res)
{
    if (!req.session.user)
    return res.status(401).send('Not logged in')

    else
    return res.status(200).send(req.session.user)
})
export default router