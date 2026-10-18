import { runAllTests as runCompanyLookupTests } from './companyLookup.test';
import { runEImzoTests } from './eimzo.test';

async function main() {
  try {
    await runCompanyLookupTests();
    await runEImzoTests();
    console.log('🎉 BARCHA TESTLAR (STIR Lookup + E-IMZO Tekshiruv) MUVAFFAQIYATLI O\'TDI!\n');
    process.exit(0);
  } catch (err) {
    console.error('Testlar xatosi:', err);
    process.exit(1);
  }
}

main();
