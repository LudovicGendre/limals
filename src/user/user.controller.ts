import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { query } from 'express';
import { diskStorage } from 'multer';
import path = require('path');
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto, FilterDto } from 'src/dtos';
import { AuthGuard } from 'src/guards/auth.guard';

import { UserService } from './user.service';

import { createParamDecorator } from '@nestjs/common';
import { LoggedUser } from 'src/decorators/logged-user.decorator';

export const AuthUser = createParamDecorator((data, req) => {
  return req.user;
});
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async list(@Query() query: FilterDto<User> | undefined): Promise<User[]> {
    return await this.userService.list({
      skip: parseInt(query.skip) || 0,
      take: parseInt(query.take) || 20,
      orderBy: { username: query.order },
      where: { username: query.search },
    });
  }

  // Ludo: Pas nécessaire (duplication), nous avons déjà l'ensemble des users en relation dans /cities/:id

  // @Get('/city/:id')
  // async listCity(@Param('id') id: string): Promise<User[]> {
  //   return await this.userService.getCity({
  //     cityWhereUniqueInput: {
  //       id,
  //     },
  //   });
  // }

  // @UseGuards(AuthGuard)
  @Get('/proximity')
  async getUsersInRadius(
    @Query('radius') radius: string,
    @Request() req: any,
  ): Promise<User[]> {
    console.log(req);
    const currentUser = await this.userService.get({
      username: req.user.username,
    });
    return await this.userService.getUsersInRadius(radius, currentUser);
  }

  @Get('/:id')
  async get(@Param('id') id: string): Promise<User> {
    return await this.userService.get({ id: id });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename: string =
            path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
          const extension: string = path.parse(file.originalname).ext;

          cb(null, `${filename}${extension}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @LoggedUser() user: any,
  ): Promise<User> {
    const auth = await this.userService.get(user);

    return await this.userService.update({
      where: { id: auth.id },
      data: { avatar: file.filename },
    });
  }

  @Post('/')
  async create(@Body() user: CreateUserDto): Promise<User> {
    return await this.userService.create(user);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string): Promise<User> {
    return await this.userService.delete({ id: id });
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() city: CreateUserDto,
  ): Promise<User> {
    return await this.userService.update({
      where: { id: id },
      data: city,
    });
  }
}
