const Appointment = require('../models/Appointment');

const Hospital = require('../models/Hospitals');
//@desc Get all appointments
//@route GET /api/v1/appointments   
//@access Public
exports.getAppointments = async(req, res, next) => { 
    try {
        // เพิ่มการตรวจสอบ req.user
        if (!req.user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        
        let query;
        
        //General users can see only their appointments
        if(req.user.role !== 'admin'){
            query = Appointment.find({ user: req.user.id }).populate({
                path: 'hospital',
                select: 'name province tel'
            });
        }
        else{
            //Admin can see all appointments
            if(req.params.hospitalId){
                // เปลี่ยนจากการค้นหาทั้งหมดเป็นค้นหาเฉพาะ hospital ที่ระบุ
                query = Appointment.find({ hospital: req.params.hospitalId }).populate({
                    path: 'hospital',
                    select: 'name province tel'
                });
            }
            else{
                query = Appointment.find().populate({
                    path: 'hospital',
                    select: 'name province tel'
                });
            }
        }
        
        const appointments = await query;
        res.status(200).json({ success: true, count: appointments.length, data: appointments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Cannot find appointment" });
    }
};
exports.getAppointment = async(req, res, next) => { 
    try{
        const appointment = await Appointment.findById(req.params.id).populate({
            path: 'hospital',
            select: 'name province tel'
        });
        if(!appointment){
            return res.status(400).json({ success: false ,message: "No appointment found"});
        }
        res.status(200).json({ success: true, data: appointment });
    }
    catch(err){
        console.log(err);
        res.status(400).json({ success: false ,message: "Cannot find appointment" });   
    }
};

exports.addAppointment = async(req, res, next) => { 
    try{
        req.body.user = req.user.id;
        req.body.hospital = req.params.hospitalId ;
        const hospital = await Hospital.findById(req.body.hospital);
        if(!hospital){
            return res.status(400).json({ success: false ,message: "No hospital with the id of " + req.body.hospital});
        }
        if (!req.user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        const existedAppointment = await Appointment.find({user:req.user.id});
        if(existedAppointment.length >= 3 && req.user.role !== 'admin'){
            return res.status(400).json({ success: false ,message: "The user with ID " + req.user.id + " has already made 3 appointments"});
        }
        if (!req.body.hospital) {
            return res.status(400).json({ 
                success: false, 
                message: "Hospital is required. Please provide hospital ID in request body or URL parameter." 
            });
        }
        const appointment = await Appointment.create(req.body);
        res.status(200).json({ success: true, data: appointment });
    }
    catch(err){
        console.log(err);
        res.status(500).json({ success: false ,message: "Cannot create appointment" });   
    }
}

exports.updateAppointment = async(req, res, next) => {
    try{    
        let appointment = await Appointment.findById(req.params.id);
        if(appointment.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({ success: false ,message: "User " + req.user.id + " is not authorized to update this appointment"});
        }
        if(!appointment){
            return res.status(400).json({ success: false ,message: "No appointment found"});
        }
        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: appointment });
    }
    catch(err){
        console.log(err);
        res.status(500).json({ success: false ,message: "Cannot update appointment" });   
    }
};


exports.deleteAppointment = async(req, res, next) => {
    try{    
        const appointment = await Appointment.findById(req.params.id);
        
        if(!appointment){
            return res.status(400).json({ success: false ,message: "No appointment found"});
        }
        
        if(appointment.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({ success: false ,message: "User " + req.user.id + " is not authorized to delete this appointment"});
        }
        
        await appointment.deleteOne();
        res.status(200).json({ success: true, data: {} });
    }
    catch(err){
        console.log(err);
        res.status(500).json({ success: false ,message: "Cannot delete appointment" });   
    }
};
