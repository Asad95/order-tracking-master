var express = require("express");
var bodyParser = require("body-parser")
var request = require('request');
var moment = require('moment');
const {API_KEY} = require('./config/config')
const Aftership = require('aftership')(API_KEY);
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);


app.get('/track', async(req, res) => {
    res.render(__dirname + '/public/index.html',{err:null, data:null});
})

app.post('/track', async(req, res) => {
    try{
        var response = await createTrack(req.body.trackId)
        if(response.status === 200){
            await sleep(3000).then(async () => {
                var data = await getTrack(req.body.trackId, response.slug)
                if(data.status === 4010){
                    return res.render(__dirname + '/public/index.html',{err:"something went wrong", data:null});
                }
                else{
                    // res.json({data:data.success})
                    return res.render(__dirname + '/public/details.html',{data:data.success, moment:moment});
                }
            });
        }
        else{
            var data = await getTrack(req.body.trackId, response.slug)
            if(data.status === 4010){
                return res.render(__dirname + '/public/index.html',{err:"something went wrong", data:null});
            }
            else{
                // res.json({data:data.success, response:response})
                return res.render(__dirname + '/public/details.html',{data:data.success, moment:moment});
            }
        }
    }
    catch(e){
        res.render(__dirname + '/public/index.html',{err:"something went wrong", data:null});
    }
})

getTrack =  async(trackId, slug) => {
    return new Promise((resolve, reject)=>{
        Aftership.call('GET', `/trackings/${slug}/${trackId}`, function (err, result) {
            if(err){
                console.log(err)
                resolve({
                    error:err.message,
                    slug: slug,
                    status:err.code
                });
            }
            else{
                // console.log(result)
                resolve({
                    success:result.data,
                    slug: slug,
                    status:200
                });
            }
        });
    })
}


createTrack = async(trackId) => {
    return new Promise((resolve, reject)=>{
        let body = {
            'tracking': {
                'tracking_number': trackId,
            }
        };
        Aftership.call('POST', '/trackings', {
            body: body
        }, (err, result) => {
            if(err){
                resolve({
                    error:err.message,
                    slug: err.data.tracking.slug,
                    status:err.code
                });
            }
            else{
                resolve({
                    success:result,
                    // success:"Create Successfully",
                    slug: result.data.tracking.slug,
                    status:200
                });
            }
        });
    })
}

// sleep time expects milliseconds
sleep = async (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}
  

const PORT = 3010;
app.listen(PORT, () => {
    console.log(`Server is listen to ${PORT}`);
});