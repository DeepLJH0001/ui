import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  prefs: service(),

  queryParams: ['which','sortBy','descending'],
  which: 'running',
  sortBy: 'id',
  descending: false,

  actions: {
    replay(process) {
      if ( process.hasAction('replay') ) {
        process.doAction('replay');
      }
    }
  },

  headers: function() {
    let which = this.get('which');
    let out = [
      {
        name: 'id',
        translationKey: 'generic.id',
        sort: ['id:desc'],
        width: 120,
      },
      {
        name: 'processName',
        translationKey: 'generic.name',
        sort: ['processName','id:desc'],
      },
      {
        translationKey: 'processesPage.list.table.resource',
        name: 'resource',
        sort: ['resourceType','id:desc'],
        searchField: ['typeAndId', 'resourceType','resourceId'],
      }
    ];

    if ( which === 'delayed' || which === 'completed' ) {
      out.push({
        translationKey: 'processesPage.list.table.exitReason',
        name: 'exitReason',
        sort: ['exitReason','id:desc'],
        width: 150,
      });
    }

    out.push({
      translationKey: 'processesPage.list.table.startTime',
      name: 'startTime',
      sort: ['startTime:desc','id:desc'],
      width: 120,
    });

    if ( which === 'completed' ) {
      out.push({
        translationKey: 'processesPage.list.table.endTime',
        name: 'endTime',
        sort: ['endTime:desc','id:desc'],
        width: 120,
      });
    }

    if ( which === 'delayed' ) {
      out.push({
        translationKey: 'processesPage.list.table.runAfter',
        name: 'runAfter',
        sort: ['runAfter:desc','id:desc'],
        width: 120,
        searchField: false,
      });
    } else {
      out.push({
        translationKey: 'processesPage.list.table.runTime',
        name: 'runTime',
        sort: ['runTime:desc','id:desc'],
        width: 100,
      });
    }

    return out;
  }.property('which'),
});
