import { Router } from 'express';
import {
    getAllPages,
    getPageById,
    updatePageById,
    deletePageById,
    addPage,
    getPageByLinkUrl // Import the new function
} from '../controllers/pageController.js'; // Ensure correct path to your controller

const router = Router();



export default router;