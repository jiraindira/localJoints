/**
 * Created by Jiraindira on 9/27/15.
 */

var requestParms = {
    clientId: "DO5JJHGXBODWHZUZ2W45T0S35PKJH3MCLC1SKF5U4X3VF4YA",
    clientSecret: "GF0PDCNGEKSU2GI4ANGBGBKTEUU0G3E3QYPO5YWFXRV33GY5",
    version: "20131230"
}

var myService = angular.module('myService', ['ngResource']);

myService.factory('placesExplorerService', function ($resource) {

    var requestUri = 'https://api.foursquare.com/v2/venues/:action';

    return $resource(requestUri,
        {
            action: 'suggestCompletion',
            client_id: requestParms.clientId,
            client_secret: requestParms.clientSecret,
            v: requestParms.version,
            //venuePhotos: '1',
            callback: 'JSON_CALLBACK'
        },
        {
            get: { method: 'JSONP' }
        });

});