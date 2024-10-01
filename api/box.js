const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const BoxSchemas = require('../schema/Box');
const Str = require('@supercharge/strings')

router.get('/getall', async (req, res) => {
    try {
        // Sort by 'type' first and then by 'name'
        let policies = await BoxSchemas.find().sort({ type: 1, name: 1 }).collation({ locale: "en_US", numericOrdering: true });
        res.status(200).json(policies);
        console.log(policies);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// router.get('/getall', async (req, res) => {
//     try {
//         let nameSorted = await BoxSchemas.find().sort({ name: 'asc' }).collation({ locale: "en_US", numericOrdering: true });

//         res.json({ nameSorted });
//     } catch (err) {
//         res.json({ msg: err.message });
//     }
// });

router.get('/search', async (req, res) => {
    try {
        let policies = await BoxSchemas.find({

            $and: [
                { $or: [{ unmount: null }, { unmount: "" }] },
                { "mount": { $ne: null } }
            ]
        });
        res.json(policies);
    }
    catch (err) {
        res.json({ msg: err.message });
    }
});

// router.post("/add", async (req, res) => {
//   console.log(req.body);
//   try {
//     // let holiday = await BoxSchemas.find();

//     const holiday = new BoxSchemas(req.body);
//     await holiday.save();
//     res.json(holiday);
//   } catch (error) {
//     console.log(error.message);
//     return res.status(500).json({ msg: "Server Error....." });
//   }
// });

//my code   shamshad

router.post("/add", async (req, res) => {
    try {
      // Parse data array from request body
      const dataArray = req.body;
      console.log("Received data:", dataArray);
      // Ensure dataArray is an array
      if (!Array.isArray(dataArray)) {
        return res.status(400).json({ msg: "Data must be an array" });
      }
      // Loop through each object in the data array and save to the database
      const promises = dataArray.map(async (data) => {
        // Create a new BoxSchemas instance for each data object and save to the database
        const holiday = new BoxSchemas({
          name: data.name,
          type: data.type,
          client: data.client,
          city: data.city.trim(),
          container: data.container,
          rack: data.rack,
          story: data.story,
          sid: data.sid,
          checkin: data.checkin,
          checkout: data.checkout,
          addby: data.addby,
          // Add other fields as needed
        });
        // Save the instance to the database
        await holiday.save();
        return holiday;
      });
      // Wait for all save operations to complete
      const results = await Promise.all(promises);
      res.json(results);
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ msg: "Server Error....." });
    }
  });

// router.post(
//     '/remove',
//     async (req, res) => {
//         try {
//             let employer = await BoxSchemas.findOne({ "rack": req.body.rack });
//             console.log(req.body.rack); // Log the value of req.body.rack
//             if (!employer) {
//                 return res.status(401).json("Event not found racker not found");
//             }
//             await BoxSchemas.deleteOne({ _id: employer._id });
//             return res.status(200).json("Event Deleted");
//         } catch (error) {
//             console.log(error.message);
//             return res.status(500).json({ msg: error.message });
//         }
//     }
// );



//mycode shamshad

router.post(
    '/remove',
    async (req, res) => {
        try {
            const { id } = req.body; // Extract the id from the request body
            let employer = await BoxSchemas.findById(id); // Find the box by its _id
            console.log(id); // Log the value of id
            if (!employer) {
                return res.status(401).json("Box not found");
            }
            await BoxSchemas.deleteOne({ _id: id }); // Delete the box by its _id
            return res.status(200).json("Box Deleted");
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ msg: error.message });
        }
    }
);


router.get(
    '/removebox',
    async (req, res) => {
        try {

            await BoxSchemas.deleteMany({ "name": "123" });
            return res.status(200).json("Event Deleted");
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ msg: error.message });
        }
    }
);


// router.post('/updatebox',async (req,res) => {
//     try {
//           let policies = await BoxSchemas.find();

//          for (let i = 0; i < policies.length; i++) {


//             BoxSchemas.findOneAndUpdate(
//                 {name : policies[i].name},
//                 { $set:  {
//                     mount : "",
//                     mountid :"",
//                     unmount :"",
//                     rsid : "",
//                     position: "",
//                     unmountid :""

//                         }},
//                 { new: true }
//               )
//                 .then(templates =>
//                     {

//                 })




// }




//     } catch (error) {
//         console.log(error.message);
//         return res.status(500);
//     }
// });


// router.get("/get-specific", (req, res, next) => {
//     let { id, rack, story } = req.query;
//     console.log("rack : ", rack, "story", story);
//     const dv = BoxSchemas.find().sort();
//     console.log(dv);
//     BoxSchemas.find({ cid: id, rack: rack, story: story })
//         .then((result) => {
//             const positionInfo = [];
//             const positions = {};

//             result.forEach((item) => {
//                 //     if (item.rack === rack && item.story === story) {
//                 // positionInfo.push(item.position);
//                 const key = `${item.rack}${item.story}`;
//                 if (!positions[key]) {
//                     positions[key] = [];
//                 }
//                 positions[key].push(item.position);
//                 //     }
//             });
//             res.status(200).json(positions);
//         })
//         .catch((error) => {
//             console.log(error);
//             res.status(500).json({ error: error });
//         });
// });


router.get("/get-specific", (req, res, next) => {
    let { sid } = req.query;
    BoxSchemas.find({ rsid: sid })
      .then((result) => {
        const positionInfo = [];
        const idInfo = [];
        // const positions = {};
        // console.log(result);
        result.forEach((item) => {
          if (item.position != "") {
            positionInfo.push(item.position);
            idInfo.push(item._id);
          }
        });
        //   //     if (item.rack === rack && item.story === story) {
        const data = {
          [sid]: {
            position: positionInfo,
            id: idInfo,
          }, // Use square brackets to set the key dynamically
        };
        //   if (!positions[key]) {
        //     positions[key] = [];
        //   }
        //   positions[key].push(item.position);
        //   //     }
        // });
        res.status(200).json(data);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: error });
      });
  });

// router.post('/update', async (req, res) => {
//     try {
//         let { id } = req.query;
//         let employer = await BoxSchemas.findById(id);
//         if (!employer) {
//             return res.status(401).json("Event not found");
//         }
//         // let obj = {
//         //     status : req.body.status
//         // }
//         Object.assign(employer, req.body);
//         const employers = await employer.save();
//         res.json(employers);
//     } catch (error) {
//         console.log(error.message);
//         return res.status(500);
//     }
// });
//honey code

router.post("/update", async (req, res) => {
    try {
      let { id } = req.query;
      let employer = await BoxSchemas.findById(id);
      if (!employer) {
        return res.status(401).json("Event not found");
      }
      Object.assign(employer, JSON.parse(req.body.data));
      employer.history.push(JSON.parse(req.body.history));
      await employer.save();
      res.json(employer);
    } catch (error) {
      console.log(error.message);
      return res.status(500);
    }
  });

router.get('/details', (req, res, next) => {
    let { id } = req.query;
    BoxSchemas.findById(id).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});

router.get('/getid', (req, res, next) => {
    let { id } = req.query;
    console.log(req.query)
    BoxSchemas.find({ "cid": id }).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});

router.get('/getsid', (req, res, next) => {
    let { id } = req.query;
    BoxSchemas.find({ "sid": id }).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});


router.get('/getdriver', (req, res, next) => {
    let { id } = req.query;
    BoxSchemas.find({
        $or: [{
            "pickedid": id

        },
        { "deliverid": id }
        ]
    }).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});


router.get('/getcity', (req, res, next) => {
    let { id } = req.query;
    BoxSchemas.find({
        $and: [
            { $or: [{ unmount: null }, { unmount: "" }] },
            { city: id }, { "mount": { $ne: null } }, { "mount": { $ne: "" } }
        ]
    }).then(result => {
        console.log(result.length);
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});


router.post('/getcbox', (req, res, next) => {
    BoxSchemas.find({ "rsid": req.body.rsid }).then(result => {
        res.status(200).json(result)
    }).catch(error => {
        console.log(error);
        res.status(500).json(
            { error: error }
        )
    })
});



router.post(
    '/addhistory',
    async (req, res) => {
        try {

            let employer = await BoxSchemas.findOne({ "_id": req.body.bid });
            if (!employer) {
                return res.status(401).json("Technicial not found");
            }
            const referc = Str.random(5)

            employer.history.push({
                "sid": referc,
                "mid": req.body.mid,
                "date": req.body.date,
                "status": req.body.status,


            });
            await employer.save();
            res.json(employer);
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ msg: error.message });
        }
    }
);


module.exports = router;