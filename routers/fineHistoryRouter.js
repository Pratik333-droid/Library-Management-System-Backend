import express from 'express'
import { FineHistory } from '../models/fineHistoryModel.js'
import { BookRequests } from '../models/bookRequestModel.js'
import { MS_PER_DAY, FINE_PER_DAY } from '../constants.js'

const router = express.Router()
router.use(express.json())

//when the admin records the fine paid by the user.
router.post('/', async function(req, res)
{
    //the record of fine payment can only be made by the admin
    if (!req.session.authorized)
    return res.status(401).send('unauthorized')

    try
    {
        const user_id = req.body.user_id
        const book_id = req.body.book_id
        let fine_amount = req.body.fine_amount

        if (!user_id || !book_id)
        return res.status(400).send('Enter user id and book id in the request body')

        const book_request = BookRequests.findOne({user_id: user_id, book_id: book_id})
        
        if (!book_request)
        return res.status(400).send('User has not taken the book.')

        //if the user hasn't paid fine partially
        if (!fine_amount)
        fine_amount = Math.ceil((new Date() - book_request.to_be_returned_by)/MS_PER_DAY)*FINE_PER_DAY
        
        await FineHistory.create({user_id: user_id, book_id: book_id, fine_paid: fine_amount})
    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }
    const fine = await FineHistory.findOne({user_id: req.body.user_id, book_id: req.body.book_id})
    
})
export default router