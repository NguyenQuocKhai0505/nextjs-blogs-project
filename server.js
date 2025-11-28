require("ts-node").register({
    transpileOnly: true,
    compilerOptions: {
        module: "commonjs",
        moduleResolution: "node"
    }
})
require("tsconfig-paths/register")

const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { initializeSocketIO } = require("./src/app/api/socket/route")

const dev = process.env.NODE_ENV !== "production"
const hostname ="localhost"
const port = 3000

const app = next({dev,hostname,port})
const handle = app.getRequestHandler()

app.prepare().then(()=>{
    const httpServer = createServer(async(req,res) =>{
        try{
            const parsedURL = parse(req.url,true)
            await handle(req,res,parsedURL)
        }catch(error){
            console.error("Error occurred handling", req.url,error)
            res.statusCode = 500
            res.end("internal server error")
        }
    })
    // Khoi tao Socket.IO
    initializeSocketIO(httpServer)

    httpServer.listen(port, (error) => {
        if (error) throw error
        console.log(`> Ready on http://${hostname}:${port}`)
    })
})