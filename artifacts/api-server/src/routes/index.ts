import { Router, type IRouter } from "express";
import healthRouter from "./health";
import offersRouter from "./offers";
import categoriesRouter from "./categories";
import clicksRouter from "./clicks";
import adminRouter from "./admin";
import analyticsRouter from "./analytics";
import seoRouter from "./seo";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/offers", offersRouter);
router.use("/categories", categoriesRouter);
router.use("/clicks", clicksRouter);
router.use("/admin", adminRouter);
router.use("/analytics", analyticsRouter);
router.use("/seo", seoRouter);

export default router;
