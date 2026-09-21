import { installFixtureNetwork } from './fixture-network';
installFixtureNetwork();
const variant = new URLSearchParams(location.search).get('variant');
(variant === 'candidate' ? import('./candidate-frame') : import('./actual-frame')).catch(error => {
  document.getElementById('root')!.textContent = `Specimen failed to load: ${error.message}`;
  console.error(error);
});
