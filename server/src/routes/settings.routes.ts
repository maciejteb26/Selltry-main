import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as marginCtrl from '../controllers/margin.controller';

const router = Router();
router.use(authMiddleware);

router.get('/settings/margins', marginCtrl.getMargins);
router.put('/settings/margins', marginCtrl.saveMargins);

export default router;
