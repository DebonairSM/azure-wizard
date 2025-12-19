import { Router, Request, Response } from 'express';
import { getDatabase } from '../../database/db.js';
import { AzureService, AzureServiceAttribute } from '../../shared/models/AzureService.js';

const router = Router();

/**
 * GET /api/azure-services
 * Get all Azure services
 */
router.get('/azure-services', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    let query = 'SELECT * FROM azure_services';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY service_name';

    const services = db.prepare(query).all(...params) as AzureService[];

    // Parse metadata JSON
    const servicesWithParsedMetadata = services.map(service => ({
      ...service,
      metadata: service.metadata ? JSON.parse(service.metadata) : null
    }));

    res.json(servicesWithParsedMetadata);
    return;
  } catch (error) {
    console.error('Error fetching Azure services:', error);
    res.status(500).json({ error: 'Failed to fetch Azure services' });
    return;
  }
});

/**
 * GET /api/azure-services/:id
 * Get specific Azure service with attributes
 */
router.get('/azure-services/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    // Get service
    const service = db.prepare('SELECT * FROM azure_services WHERE id = ?').get(id) as AzureService | undefined;

    if (!service) {
      return res.status(404).json({ error: 'Azure service not found' });
    }

    // Get attributes
    const attributes = db.prepare(`
      SELECT * FROM azure_service_attributes 
      WHERE service_id = ? 
      ORDER BY display_order, attribute_name
    `).all(id) as AzureServiceAttribute[];

    // Parse JSON values
    const parsedAttributes = attributes.map(attr => {
      let value = attr.attributeValue;
      if (attr.attributeType === 'json' && value) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if parsing fails
        }
      }
      return {
        ...attr,
        attributeValue: value
      };
    });

    res.json({
      ...service,
      metadata: service.metadata ? JSON.parse(service.metadata) : null,
      attributes: parsedAttributes
    });
    return;
  } catch (error) {
    console.error('Error fetching Azure service:', error);
    res.status(500).json({ error: 'Failed to fetch Azure service' });
    return;
  }
});

export default router;


