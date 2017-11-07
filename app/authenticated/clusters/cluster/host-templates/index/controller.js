import { sort } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  projects: service(),

  queryParams: ['backTo'],
  backTo: 'hosts',
  currentClusterId: null,

  actions: {
    launch(model) {
      this.transitionToRoute('authenticated.clusters.cluster.host-templates.launch', this.get('currentClusterId'), model.id);
    },
  },

  sorting: ['driver','name'],
  arranged: sort('model','sorting'),
});
