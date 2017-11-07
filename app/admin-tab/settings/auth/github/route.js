import Route from '@ember/routing/route';

export default Route.extend({
  model: function() {
    return this.get('authStore').find('config', null, {forceReload: true}).then(function(collection) {
      return collection;
    });
  },

  setupController: function(controller, model) {
    controller.setProperties({
      model: model,
      confirmDisable: false,
      testing: false,
      organizations: this.get('session.orgs')||[],
      errors: null,
      isEnterprise: (model.get('hostname') ? true : false),
    });

    controller.set('saved',true);
  }
});
