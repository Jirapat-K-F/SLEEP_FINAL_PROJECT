const Hospital = require('../models/Hospitals');
const Appointment = require('../models/Appointment');
//@desc Get all hospitals
//@route GET /api/v1/hospitals
//@access Public
exports.getHospitals = async(req, res, next) => {
    try{
        let query;
        const reqQuery = { ...req.query };
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);
        console.log(reqQuery);
        let queryStr = JSON.stringify(req.query);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        query = Hospital.find(JSON.parse(queryStr)).populate('appointments');
        const hospital = await Hospital.findById(req.params.hospitalId);
        //Select Fields
        if(req.query.select){
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }
        //Sort
        if(req.query.sort){
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        }   
        else{
            query = query.sort('-createdAt');
        }
        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;

        const total = await Hospital.countDocuments();
        query = query.skip(startIndex).limit(limit);
        //Executing query
        const hospitals = await query;
        //Pagination result
        const pagination = {};
        if(req.query.select){
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        if(startIndex > 0){
            pagination.prev = {
                page: page - 1,
                limit
            };
        }
        if(!hospitals){
            return res.status(400).json({ success: false ,message: "No hospital found"});
        }
        // Delete all appointments related to the hospital
        await Appointment.deleteMany({ hospital: req.params.hospitalId });
        await Hospital.deleteOne({ _id: req.params.hospitalId });
        res.status(200).json({ success: true, count: hospitals.length, pagination, data: hospitals });
    }
    catch(err){
        res.status(400).json({ success: false });   
    }
}


//@desc Get hospitals
//@route GET /api/v1/hospitals/:id
//@access Public
exports.getHospital = async(req, res, next) => {
    try{
        const hospital = await Hospital.findById(req.params.id);    
        if(!hospital){
            return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: hospital });
    }
    catch(err){
        res.status(400).json({ success: false });   
    }
    
}

//@desc Create new hospitals
//@route POST /api/v1/hospitals
//@access private
exports.createHospitals = async(req, res, next) => {
    const hospital =await Hospital.create(req.body);
    res.status(201).json({ success: true, data: hospital });
}

//@desc Update hospitals
//@route PUT /api/v1/hospitals/:id  
//@access Private
exports.updateHospitals = async(req, res, next) => { 
    try{
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if(!hospital){
            return res.status(400).json({ success: false });
        }   
        res.status(200).json({ success: true, data: hospital });
    }
    catch(err){
        res.status(400).json({ success: false });   
    }   
}

//@desc Delete hospitals
//@route DELETE /api/v1/hospitals/:id   
//@access Private
exports.deleteHospitals = async(req, res, next) => { 
    try{
        const hospital = await Hospital.findByIdAndDelete(req.params.id);
        if(!hospital){
            return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: {} });
    }
    catch(err){
        res.status(400).json({ success: false });   
    }
}
