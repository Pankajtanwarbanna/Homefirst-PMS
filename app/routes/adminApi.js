let auth = require('../auth/authPermission');
let Department = require('../models/department');
let Position = require('../models/position');
let User = require('../models/user');
let Course = require('../models/course');
let Workshop = require('../models/workshop');
let CourseRequest = require('../models/courseRequest');
let Asset = require('../models/asset');
let Notice = require('../models/notice');
let Project = require('../models/project');
let Attendance = require('../models/attendance');
var jwt = require('jsonwebtoken');
var secret = 'pankaj';
var nodemailer = require('nodemailer');
let multer = require('multer');

var imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __basedir + '/public/assets/uploads/')
    },
    filename: function (req, file, cb) {

        if(!file.originalname.match(/\.(jpeg|png|jpg|JPG)$/)) {
            let err = new Error();
            err.code = 'filetype';
            return cb(err);
        } else {
            cb(null,Date.now() + '_' + file.originalname.replace(/ /g,'')) // replace - to remove all white spaces
        }
    }
});

var fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __basedir + '/public/assets/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null,Date.now() + '_' + file.originalname.replace(/ /g,'')) // replace - to remove all white spaces
    }
});

module.exports = function (router){

    // Nodemailer stuff
    var client = nodemailer.createTransport({
        service : 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    });

    // User register API
    router.post('/register', auth.ensureAdmin, function (req, res) {

        let user = new User();

        user.name = req.body.name;
        user.username = req.body.username;
        user.email = req.body.email;
        let randomPassword = Math.random().toString(36).slice(-8);
        user.password =  randomPassword;// generate random password, converts to string base 36 & cut off last 8 chars
        user.position = req.body.position;
        user.department = req.body.department;
        user.branch = req.body.branch;
        user.contact_no = req.body.contact_no;
        user.permission = req.body.permission;
        user.temporarytoken = jwt.sign({ email : user.email , username : user.username }, secret , { expiresIn : '24h' });

        //console.log(req.body);
        if(!user.name || !user.email || !user.password || !user.username || !user.position || !user.department || !user.branch) {
            res.json({
                success : false,
                message : 'Ensure you filled all entries!'
            });
        } else {
            user.save(function(err) {
                if(err) {
                    // duplication errors
                    if(err.code === 11000) {
                        //console.log(err.errmsg);

                        if(err.errmsg[66] === 'e') {
                            res.json({
                                success: false,
                                message: 'Email is already registered.'
                            });
                        } else if(err.errmsg[66] === 'u') {
                            res.json({
                                success : false,
                                message : 'Username is already registered.'
                            });
                        } else {
                            res.json({
                                success : false,
                                message : err
                            });
                        }
                    } else {
                        res.json({
                            success: false,
                            message: err
                        })
                    }
                } else {

                    let email = {
                        from: 'Homefirst PMS Registration, support@homefirstindia.com',
                        to: user.email,
                        subject: 'Homefirst : People Management System Account activated',
                        text: 'Hello ' + user.name + 'Your account has been activated.Thank you Pankaj Tanwar',
                        html: 'Hello <strong>' + user.name + '</strong>,<br><br> Your account has been activated. Please find below login credentials - <br><br> Username - '+ user.username +' <br> Password - '+ randomPassword +'Thank you<br>HomeFirst.'
                    };

                    client.sendMail(email, function (err, info) {
                        if (err) {
                            console.log(err);
                            res.json({
                                success: true,
                                message: 'Account activated but Email server is not working!'
                            })
                        }
                        else {
                            console.log('Message sent: ' + info.response);
                            res.json({
                                success : true,
                                message : 'Account activated & email successfully sent to ' + user.name + '.'
                            })
                        }
                    });
                }
            });
        }
    });

    // router for get all departments
    router.get('/getAllDepartments', function (req, res) {

        Department.find({ }).lean().exec(function (err, departments) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(!departments) {
                    res.json({
                        success : false,
                        message : 'Departments not found.'
                    })
                } else {
                    res.json({
                        success : true,
                        departments : departments
                    })
                }
            }
        })
    });

    router.post('/addNewDepartment',auth.ensureAdmin, function (req, res) {
        if(!req.body.department) {
            res.json({
                success : false,
                message : 'Ensure you filled all the entries.'
            })
        } else {
            let department = new Department();

            department.department = req.body.department.toUpperCase();
            department.created_by = req.decoded.email;
            department.timestamp = new Date();

            department.save(function (err) {
                if (err) {
                    res.json({
                        success: false,
                        message: 'Something went wrong!'
                    })
                } else {
                    res.json({
                        success: true,
                        message: 'New Department added successfully.'
                    })
                }
            })
        }
    });

    // remove department router
    router.delete('/removeDepartment/:departmentID', auth.ensureAdmin, function (req, res) {
        Department.findByIdAndDelete({ _id : req.params.departmentID }, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Department successfully deleted.'
                })
            }
        })
    });

    // router for get all positions
    router.get('/getAllPositions',auth.ensureAdmin, function (req, res) {

        Position.find({ }).lean().exec(function (err, positions) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(!positions) {
                    res.json({
                        success : false,
                        message : 'Positions not found.'
                    })
                } else {
                    res.json({
                        success : true,
                        positions : positions
                    })
                }
            }
        })
    });

    // add new position router
    router.post('/addNewPosition',auth.ensureAdmin, function (req, res) {
        if(!req.body.position) {
            res.json({
                success : false,
                message : 'Ensure you filled all the entries.'
            })
        } else {
            let position = new Position();

            position.position = req.body.position.toUpperCase();
            position.created_by = req.decoded.email;
            position.timestamp = new Date();

            position.save(function (err) {
                if (err) {
                    res.json({
                        success: false,
                        message: 'Something went wrong!'
                    })
                } else {
                    res.json({
                        success: true,
                        message: 'New position added successfully.'
                    })
                }
            })
        }
    });

    // remove position route
    router.delete('/removePosition/:positionID', auth.ensureAdmin, function (req, res) {
        Position.findByIdAndDelete({ _id : req.params.positionID }, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Position successfully deleted.'
                })
            }
        })
    });

    router.post('/addNewCourse', auth.ensureAdmin, function (req, res) {
        if(!req.body) {
            res.json({
                success : false,
                message : 'Ensure you fill all the fields.'
            });
        } else {
            let course = new Course();

            course.course_name = req.body.course_name;
            course.department = req.body.department;
            course.description = req.body.description;
            course.course_url = req.body.course_url;

            if(req.body.poster) {
                course.poster = req.body.poster;
            }

            if(req.body.course_file_url) {
                course.course_file_url = req.body.course_file_url;
            }
            course.timestamp = new Date();

            course.save(function (err) {
                if(err) {
                    res.json({
                        success : false,
                        message : 'Something went wrong!'
                    })
                } else {
                    res.json({
                        success : true,
                        message : 'Course successfully added.'
                    })
                }
            })
        }
    });

    // get all courses
    router.get('/getAllCourses', auth.ensureAdmin, function (req, res) {
        Course.find({ }).select('course_name department description poster timestamp').lean().exec(function (err, courses) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(!courses) {
                    res.json({
                        success : false,
                        message : 'Courses not found.'
                    })
                } else {
                    res.json({
                        success : true,
                        courses : courses
                    })
                }
            }
        })
    });

    // get current course
    router.get('/getCourse/:courseID', auth.ensureAdmin, function (req, res) {
        Course.findOne({ _id : req.params.courseID}).lean().exec(function (err, course) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(!course) {
                    res.json({
                        success : false,
                        message : 'Course not found.'
                    })
                } else {
                    res.json({
                        success : true,
                        course : course
                    })
                }
            }
        })
    });

    // edit course
    router.post('/editCourse', auth.ensureAdmin, function (req, res) {
        Course.findByIdAndUpdate({ _id : req.body._id }, req.body, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Course successfully updated.'
                })
            }
        })
    });

    // add new workshop
    router.post('/addNewWorkshop', auth.ensureAdmin, function (req, res) {
        let workshop = new Workshop();

        workshop.title = req.body.title;
        workshop.presenter = req.body.presenter;
        workshop.department = req.body.department;
        workshop.venue = req.body.venue;
        workshop.description = req.body.description;
        workshop.time_date = req.body.time_date;
        if(req.body.poster) {
            workshop.poster = req.body.poster;
        }
        workshop.timestamp = new Date();

        workshop.save(function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Workshop successfully added.'
                })
            }
        })
    });

    // get all workshops
    router.get('/getWorkshops',auth.ensureAdmin, function (req, res) {
        Workshop.find({ }, function (err, workshops) {
            if(err) {
                res.json({
                    success: false,
                    message: 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    workshops : workshops
                })
            }
        })
    });

    // get workshop details
    router.get('/getWorkshopDetails/:workshopID', auth.ensureAdmin, function (req, res) {
        Workshop.findOne({ _id : req.params.workshopID }, function (err, workshop) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    workshop : workshop
                })
            }
        })
    });

    // update workshop
    router.post('/updateWorkshop', auth.ensureAdmin, function (req, res) {
        Workshop.findByIdAndUpdate({ _id : req.body._id }, req.body, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Workshop successfully updated.'
                })
            }
        })
    });

    // get course requests
    router.get('/getNewCourseRequests', auth.ensureAdmin, function (req, res) {
        CourseRequest.find({  }, function (err, courseRequests) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    courseRequests : courseRequests
                })
            }
        })
    });

    router.delete('/removeCourseRequest/:requestID', auth.ensureAdmin, function (req, res) {
        CourseRequest.findByIdAndDelete({ _id : req.params.requestID }, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Course Request successfully deleted.'
                })
            }
        })
    });

    // get users
    router.get('/getUsers', function (req, res) {
        User.find({ }, function (err, users) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    users : users
                })
            }
        })
    });

    // remove course
    router.delete('/removeCourse/:courseID', auth.ensureAdmin, function (req, res) {
        Course.findByIdAndDelete({ _id : req.params.courseID }, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong, try again later!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Course successfully deleted.'
                })
            }
        })
    });

    // add new asset
    router.post('/addAsset', auth.ensureAdmin, function (req, res) {
        let asset = new Asset();

        asset.item = req.body.item;
        asset.employee_email = req.body.employee_email;
        asset.issue_date = req.body.issue_date;
        asset.return_date = req.body.return_date;
        asset.created_by = req.decoded.email;
        asset.timestamp = new Date();

        asset.save(function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Asset successfully added.'
                })
            }
        })
    });
    
    // get all assets
    router.get('/getAllAssets', auth.ensureAdmin, function (req, res) {
        Asset.aggregate([
            { $lookup : {
                    from : "users",
                    localField : "employee_email",
                    foreignField : "email",
                    as : "user"
                }
            }
        ]).exec(function (err, assets) {
            if(err) {
                console.log(err);
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                console.log(assets)
                res.json({
                    success : true,
                    assets : assets
                })
            }
        })
    });

    // received item
    router.post('/receivedItem/:assetID', auth.ensureAdmin, function (req, res) {
        Asset.findOne({ _id : req.params.assetID }).select('status received_on').exec(function (err, asset) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(asset.status !== 'pending') {
                    res.json({
                        success : false,
                        message : 'Asset already recieved.'
                    })
                } else {
                    asset.status = 'received';
                    asset.received_on = new Date();

                    asset.save(function (err) {
                        if(err) {
                            res.json({
                                success : false,
                                message : 'Something went wrong!'
                            })
                        } else {
                            res.json({
                                success : true,
                                message : 'Asset received successfully. '
                            })
                        }
                    })
                }
            }
        })
    });

    // add new notice
    router.post('/addNotice', auth.ensureAdmin, function (req, res) {
        let notice = new Notice();

        notice.title = req.body.title[0].toUpperCase() + req.body.title.slice(1);
        notice.department_id = req.body.department_id;
        notice.notice_info = req.body.notice_info;
        notice.created_by = req.decoded.email;
        notice.timestamp = new Date();

        notice.save(function (err) {
            if(err) {
                console.log(err);
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                console.log('success')
                res.json({
                    success : true,
                    message : 'Notice successfully added.'
                })
            }
        })
    });

    // get all assets
    router.get('/getAllNotices', auth.ensureAdmin, function (req, res) {
        Notice.aggregate([
            { $lookup : {
                    from : "departments",
                    localField : "department_id",
                    foreignField : "_id",
                    as : "department_info"
                }
            }
        ]).exec(function (err, notices) {
            if(err) {
                console.log(err);
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    notices : notices
                })
            }
        })
    });

    // get notice by id
    router.get('/getNotice/:noticeID', auth.ensureAdmin, function (req, res) {
        Notice.findOne({ _id : req.params.noticeID }).select('title department_id notice_info').lean().exec(function (err, notice) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(!notice) {
                    res.json({
                        success : false,
                        message : 'Notice not found.'
                    })
                } else {
                    res.json({
                        success : true,
                        notice : notice
                    })
                }
            }
        })
    });

    // update notice
    router.post('/updateNotice', auth.ensureAdmin, function (req, res) {
        Notice.findByIdAndUpdate({ _id : req.body._id }, req.body, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Notice successfully updated.'
                })
            }
        })
    });

    // add new project
    router.post('/addProject', auth.ensureAdmin, function (req, res) {
        let project = new Project();

        project.title = req.body.title[0].toUpperCase() + req.body.title.slice(1);
        project.description = req.body.description;
        project.members = req.body.members;
        project.department_id = req.body.department_id;
        project.start_date = req.body.start_date;
        project.deadline = req.body.deadline;
        project.progress = 0;
        project.created_by = req.decoded.email;
        project.timestamp = new Date();

        project.save(function (err) {
            if(err) {
                console.log(err);
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Project successfully added.'
                })
            }
        })
    });

    // get all projects
    router.get('/getAllProjects', auth.ensureAdmin, function (req, res) {
        Project.aggregate([
            { $lookup : {
                    from : "departments",
                    localField : "department_id",
                    foreignField : "_id",
                    as : "department_info"
                }
            },
            { $lookup : {
                    from : "users",
                    localField : "members",
                    foreignField : "email",
                    as : "users_info"
                }
            },
            { $lookup : {
                    from : "users",
                    localField : "created_by",
                    foreignField : "email",
                    as : "author"
                }
            }
        ]).exec(function (err, projects) {
            if(err) {
                console.log(err);
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    projects : projects
                })
            }
        })
    });

    // update project
    router.post('/editProject', auth.ensureAdmin, function (req, res) {
        Project.findByIdAndUpdate({ _id : req.body._id }, req.body, function (err) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                res.json({
                    success : true,
                    message : 'Project successfully updated.'
                })
            }
        })
    });

    //get all users attendance
    router.get('/getUsersAttendance', auth.ensureAdmin, function (req, res) {
        Attendance.aggregate([
            { $lookup : {
                    from : "users",
                    localField : "employee_email",
                    foreignField : "email",
                    as : "users_info"
                }
            }
        ]).exec(function (err, attendances) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(!attendances) {
                    res.json({
                        success : false,
                        message : 'Attendance not found.'
                    })
                } else {
                    res.json({
                        success : true,
                        attendances : attendances
                    })
                }
            }
        })
    });

    // addAttendance router
    router.post('/addAttendanceFunction', auth.ensureAdmin, function (req, res) {
        Attendance.findOne({ date : (new Date(req.body.date)).setHours(0,0,0,0), employee_email : req.body.employee_email }).lean().exec(function (err, attendance) {
            if(err) {
                res.json({
                    success : false,
                    message : 'Something went wrong!'
                })
            } else {
                if(!attendance) {
                    // good to go
                    let attend = new Attendance();

                    attend.date = (new Date(req.body.date)).setHours(0,0,0,0);
                    attend.employee_email = req.body.employee_email;
                    attend.status = req.body.status;
                    attend.sign_in = req.body.sign_in;
                    attend.sign_out = req.body.sign_out;
                    attend.lunch_in = req.body.lunch_in;
                    attend.lunch_out = req.body.lunch_out;
                    attend.note = req.body.note;
                    attend.created_by = req.decoded.email;
                    attend.timestamp = new Date();

                    attend.save(function (err) {
                        if(err) {
                            res.json({
                                success :  false,
                                message : 'Something went wrong!'
                            })
                        } else {
                            res.json({
                                success : true,
                                message : 'Attendance marked successfully!'
                            })
                        }
                    })

                } else {
                    res.json({
                        success : false,
                        message : 'Attendance already marked.'
                    })
                }
            }
        })
    });

    return router;
};
