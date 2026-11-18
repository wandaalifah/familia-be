import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';

// Regression: schemas that JSON Schema cannot represent (e.g. z.coerce.date())
// make Swagger document generation throw at startup.
describe('Swagger document', () => {
  it('builds for every route without throwing', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').build(),
    );

    expect(document.paths['/admin/points/history']).toBeDefined();
    expect(document.paths['/admin/medical-history/list']).toBeDefined();

    await app.close();
  });
});
