const express = require('express');
const router = express.Router();
const handlers = require('./handlers');


router.post('/simple-llm', handlers.simpleLlmReply); //
router.post('/book-existing', handlers.bookAppointmentWithExistingPatient);


router.post('/create-db', handlers.createDatabase);
router.post('/execute', handlers.executeQuery);
router.post('/read-file', handlers.readFile);
router.post('/write-file', handlers.writeFile);
router.post('/ask-llm', handlers.askLLM);
router.post('/view-available', handlers.viewAvailableDoctors);
router.post('/book', handlers.bookAppointment);

router.post('/view-appointments', handlers.viewAppointments);


module.exports = router;
