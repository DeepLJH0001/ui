import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import C from 'ui/utils/constants';

export default Route.extend({
  settings: service(),

  beforeModel() {
    return this.get('settings').load([
      C.SETTING.API_HOST,
      C.SETTING.CATALOG_URL,
      C.SETTING.TELEMETRY,
    ]);
  },

  model() {
    let settings = this.get('settings');

    return this.get('userStore').find('setting').then(() => {
      return EmberObject.create({
        host:      settings.get(C.SETTING.API_HOST),
        catalog:   settings.get(C.SETTING.CATALOG_URL),
        telemetry: settings.get(C.SETTING.TELEMETRY),
      });
    });
  },

  resetController(controller, isExiting /*, transition*/ ) {
    if (isExiting) {
      controller.set('error', null);
    }
  }
});
