module.exports = function (cy, $, options, cyGraphML) {
  function renderNode($graph, $parent) {
    $graph.children("node").each(function () {
      var $node = $(this);

      var settings = {
        data: { id: $node.attr("id") },
        css: {},
        position: {}
      };

      if ($parent != null)
        settings["data"]["parent"] = $parent.attr("id");

      $node.children('data').each(function () {
        var $data = $(this);
        var mapKey = nodeKeyDict[$data.attr("key")]["name"];
        var mapData = $data.text()
        if (nodeKeyDict[$data.attr("key")]["type"] != "string") {
          mapData = Number(mapData)
        }
        settings["data"][mapKey] = mapData;
      });

      cy.add({
        group: "nodes",
        data: settings.data,
        css: settings.css,
        position: settings.position
      });

      $node.children("graph").each(function () {
        var $graph = $(this);

        renderNode($graph, $node);
      });
    });
  }

  cy.batch(function () {
    xml = $.parseXML(cyGraphML);
    $xml = $(xml);

    // Get dict to map actual key names into cyctoscape
    let nodeKeyDict = {};
    $xml.find("key").each(function () {
      let attr = this.attributes;
      if (attr['for'].value == "node") {
        nodeKeyDict[attr['id'].value] =
        {
          'type': attr['attr.type'].value,
          'name': attr['attr.name'].value
        }
      }
    })
    
    $graphs = $xml.find("graph").first();

    $graphs.each(function () {
      var $graph = $(this);

      renderNode($graph, null);

      $graph.find("edge").each(function () {
        var $edge = $(this);

        var settings = {
          data: { id: $edge.attr("id"), source: $edge.attr("source"), target: $edge.attr("target") },
          css: {},
          position: {}
        };

        $edge.find('data').each(function () {
          var $data = $(this);
          settings["data"][$data.attr("key")] = $data.text();
        });

        cy.add({
          group: "edges",
          data: settings.data,
          css: settings.css
        });
      });

    });
    var layoutOptT = typeof options.layoutBy;
    if (layoutOptT == "string")
      cy.layout({ name: options.layoutBy }).run();
    else if (layoutOptT == "function")
      options.layoutBy();
  });
};
