/**
 * Test script for PolicyWizard
 * Tests core functionality to ensure everything works
 */

// #region agent log
fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:6',message:'Test script started',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

async function testPolicyWizard() {
  const results = {
    compilation: null,
    imports: null,
    validation: null,
    xmlGeneration: null,
    examples: null,
    errors: []
  };

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:15',message:'Starting test suite',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Test 1: Try to import PolicyWizard
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:22',message:'Attempting to import PolicyWizard',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const wizardModule = await import('./index.js');
    const { PolicyWizard } = wizardModule;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:28',message:'PolicyWizard imported successfully',data:{hasPolicyWizard:!!PolicyWizard,hasStart:!!PolicyWizard?.start,hasValidate:!!PolicyWizard?.validate,hasToXml:!!PolicyWizard?.toXml},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    results.imports = { success: true, PolicyWizard };

    // Test 2: Test PolicyWizard.start()
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:36',message:'Testing PolicyWizard.start',data:{scope:'api',apiId:'test-api'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const instance = PolicyWizard.start('api', 'test-api');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:42',message:'PolicyWizard.start completed',data:{hasInstance:!!instance,hasGetPolicyModel:!!instance?.getPolicyModel,hasToXml:!!instance?.toXml,hasValidate:!!instance?.validate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Test 3: Create a simple policy model
      const model = instance.getPolicyModel();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:50',message:'Got policy model',data:{scope:model.scope,apiId:model.apiId,hasSections:!!model.sections},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Add a simple policy item
      model.sections = {
        inbound: {
          includeBase: true,
          items: [
            {
              type: 'catalog',
              policyId: 'rate-limit',
              order: 1,
              configuration: {
                calls: 100,
                'renewal-period': 60
              }
            }
          ]
        }
      };

      instance.updatePolicyModel(model);

      // Test 4: Test validation
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:75',message:'Testing validation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        const validation = instance.validate();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:80',message:'Validation completed',data:{valid:validation.valid,errorsCount:validation.errors.length,warningsCount:validation.warnings.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        results.validation = { success: true, validation };
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:87',message:'Validation failed',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        results.validation = { success: false, error: error.message };
        results.errors.push({ test: 'validation', error: error.message });
      }

      // Test 5: Test XML generation
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:96',message:'Testing XML generation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        const xml = instance.toXml();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:101',message:'XML generation completed',data:{xmlLength:xml.length,hasPoliciesTag:xml.includes('<policies>'),hasInbound:xml.includes('<inbound>'),hasRateLimit:xml.includes('rate-limit')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        results.xmlGeneration = { success: true, xml, xmlLength: xml.length };
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:108',message:'XML generation failed',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        results.xmlGeneration = { success: false, error: error.message };
        results.errors.push({ test: 'xmlGeneration', error: error.message });
      }

      // Test 6: Test static methods
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:116',message:'Testing static methods',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        const staticValidation = PolicyWizard.validate(model);
        const staticXml = PolicyWizard.toXml(model);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:122',message:'Static methods completed',data:{validationValid:staticValidation.valid,staticXmlLength:staticXml.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion

        results.staticMethods = { success: true, validation: staticValidation, xml: staticXml };
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:128',message:'Static methods failed',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        results.staticMethods = { success: false, error: error.message };
        results.errors.push({ test: 'staticMethods', error: error.message });
      }

    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:136',message:'PolicyWizard.start or instance methods failed',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      results.errors.push({ test: 'start', error: error.message });
    }

  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:143',message:'Import failed',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    results.imports = { success: false, error: error.message };
    results.errors.push({ test: 'import', error: error.message });
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/35d682e6-ea0b-4cff-9182-d29fd3890771',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-wizard.js:150',message:'Test suite completed',data:{totalErrors:results.errors.length,importsSuccess:results.imports?.success,validationSuccess:results.validation?.success,xmlGenerationSuccess:results.xmlGeneration?.success},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return results;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('test-wizard.js')) {
  testPolicyWizard()
    .then(results => {
      console.log('\n=== Test Results ===');
      console.log(JSON.stringify(results, null, 2));
      
      if (results.errors.length > 0) {
        console.error('\n❌ Tests failed with errors:');
        results.errors.forEach(err => console.error(`  - ${err.test}: ${err.error}`));
        process.exit(1);
      } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testPolicyWizard };

