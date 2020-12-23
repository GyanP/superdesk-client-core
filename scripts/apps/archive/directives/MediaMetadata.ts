import _ from 'lodash';
import {appConfig} from 'appConfig';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';

MediaMetadata.$inject = ['userList', 'archiveService', 'metadata', 'vocabularies'];

export function MediaMetadata(userList, archiveService, metadata, vocabularies) {
    return {
        scope: {
            item: '=',
        },
        templateUrl: 'scripts/apps/archive/views/metadata-view.html',
        link: function(scope, elem) {
            scope.$watch('item', reloadData);
            scope.isCorrectionWorkflowEnabled = appConfig?.corrections_workflow;

            vocabularies.getVocabularies().then((vocabulariesCollection) => {
                scope.label = (id) => getLabelForFieldId(id, vocabulariesCollection);
            });

            function reloadData() {
                var qcodes = [];

                metadata.getFilteredCustomVocabularies(qcodes).then((cvs) => {
                    scope.cvs = _.sortBy(cvs, 'priority');
                    scope.genreInCvs = _.map(cvs, 'schema_field').indexOf('genre') !== -1;
                    scope.placeInCvs = _.map(cvs, 'schema_field').indexOf('place') !== -1;
                });

                scope.originalCreator = scope.item.original_creator;
                scope.versionCreator = scope.item.version_creator;

                if (!archiveService.isLegal(scope.item)) {
                    if (scope.item.original_creator) {
                        userList.getUser(scope.item.original_creator)
                            .then((user) => {
                                scope.originalCreator = user.display_name;
                            });
                    }
                    if (scope.item.version_creator) {
                        userList.getUser(scope.item.version_creator)
                            .then((user) => {
                                scope.versionCreator = user.display_name;
                            });
                    }
                }
            }

            scope.getLocaleName = function(terms, scheme) {
                const term = terms.find((element) => element.scheme === scheme);

                if (!term) {
                    return 'None';
                }

                if (term.translations && scope.item.language
                    && term.translations.name[scope.item.language]) {
                    return term.translations.name[scope.item.language];
                }

                return term.name;
            };
        },
    };
}
