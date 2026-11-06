import { Router } from 'express';
import { AnamneseController } from '../controllers/anamneseController';

const router = Router();
const anamneseController = new AnamneseController();

router.post('/anamnese', anamneseController.criar);
router.get('/anamnese', anamneseController.listar);
router.get('/anamnese/:id', anamneseController.buscarPorId);
router.put('/anamnese/:id', anamneseController.atualizar);
router.delete('/anamnese/:id', anamneseController.deletar);
router.get('/anamnese/:id/treino', anamneseController.gerarTreino);

export default router;