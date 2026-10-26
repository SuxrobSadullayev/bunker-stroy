import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin & Platform Management')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'BUNKER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platformaning umumiy B2B/B2C moliyaviy va operatsion statistikasi' })
  getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Tizim audit va xavfsizlik loglari' })
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
