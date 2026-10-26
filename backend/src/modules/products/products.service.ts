import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  // In-memory fallback
  private mockProducts: any[] = [
    {
      id: 'prod-sement-m500',
      title: 'Sement M500 D0 (Qizilqum)',
      category: 'Sement',
      price: 920000,
      costPrice: 850000,
      stock: 450,
      unit: 'tonna',
      minOrder: 1,
      supplierId: 'supp-101',
      salesCount: 38,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod-armatura-a500c',
      title: 'Armatura A500C Ø12mm (Bekobod)',
      category: 'Metall va armatura',
      price: 8800000,
      costPrice: 8200000,
      stock: 80,
      unit: 'tonna',
      minOrder: 1,
      supplierId: 'supp-102',
      salesCount: 22,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod-gisht-pishiq',
      title: 'Pishiq g‘isht (M150 Yangiyo‘l)',
      category: 'G\'isht va bloklar',
      price: 1350,
      costPrice: 1100,
      stock: 50000,
      unit: 'dona',
      minOrder: 5000,
      supplierId: 'supp-103',
      salesCount: 14000,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, search?: string) {
    try {
      const where: any = {};
      if (category) where.category = category;
      if (search) {
        where.title = { contains: search, mode: 'insensitive' };
      }
      const dbProducts = await this.prisma.product.findMany({ where });
      if (dbProducts.length > 0) return dbProducts;
    } catch {}

    // Fallback in-memory filter
    let results = [...this.mockProducts];
    if (category) {
      results = results.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (search) {
      results = results.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    }
    return results;
  }

  async findOne(id: string) {
    try {
      const p = await this.prisma.product.findUnique({ where: { id } });
      if (p) return p;
    } catch {}

    const found = this.mockProducts.find((p) => p.id === id);
    if (!found) throw new NotFoundException(`Mahsulot topilmadi (#${id})`);
    return found;
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          title: dto.title,
          category: dto.category,
          price: dto.price,
          costPrice: dto.costPrice || 0,
          stock: dto.stock,
          unit: dto.unit,
          minOrder: dto.minOrder || 1,
          description: dto.description || null,
          supplierId: dto.supplierId || 'supp-default',
        },
      });
    } catch {
      const newProduct = {
        id: `prod-${Date.now()}`,
        ...dto,
        salesCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      this.mockProducts.unshift(newProduct);
      return newProduct;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: dto,
      });
    } catch {
      const p = await this.findOne(id);
      Object.assign(p, dto);
      return p;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch {
      this.mockProducts = this.mockProducts.filter((p) => p.id !== id);
    }
    return { success: true, message: `Mahsulot o‘chirildi (#${id})` };
  }
}
