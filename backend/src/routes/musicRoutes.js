import { Router } from "express";
import { search,stream ,getRecent,deleteRecentSong} from "../controllers/musicController.js";

const musicRouter=Router();

musicRouter.get("/search",search);
musicRouter.get("/recent",getRecent);
musicRouter.delete("/recent/:id",deleteRecentSong)
musicRouter.post("/stream",stream);

export default musicRouter;
 
