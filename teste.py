def definer_params(**parameters):
    params_xml = ""
    for key, value in parameters.items():
      value_str = "" if value is None else str(value)
      param_xml = f"""
      <RptParameterReportPar>
      <Description>{key}</Description>
      <ParamName>{key}</ParamName>
      <Type xmlns:d3p1="http://schemas.datacontract.org/2004/07/System" xmlns:d3p2="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.RuntimeType" i:type="d3p2:RuntimeType" xmlns:d3p3="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.UnitySerializationHolder" z:FactoryType="d3p3:UnitySerializationHolder" xmlns:z="http://schemas.microsoft.com/2003/10/Serialization/">
        <Data xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">System.String</Data>
        <UnityType xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:int" xmlns="">4</UnityType>
        <AssemblyName xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</AssemblyName>
      </Type>
      <Value xmlns:d3p1="http://www.w3.org/2001/XMLSchema" i:type="d3p1:string">{value_str}</Value>
      <Visible>true</Visible>
      </RptParameterReportPar>
        """
      params_xml += param_xml
    return params_xml


def generate_report(id_report, **parameters):
  parameters = definer_params(**parameters)
  xml_generate = f"""
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
     <soapenv:Header/>
     <soapenv:Body>
        <tot:GenerateReport>
           <!--Optional:-->
           <tot:codColigada>1</tot:codColigada>
           <!--Optional:-->
           <tot:id>{id_report}</tot:id>
           <!--Optional:-->
           <tot:filters><![CDATA[<?xml version="1.0" encoding="utf-16"?>
  <ArrayOfRptFilterReportPar xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.totvs.com.br/RM/">
    <RptFilterReportPar>
      <BandName>RptReport</BandName>
      <FiltersByTable>
        <RptFilterByTablePar>
          <Filter>PFUNC.CHAPA &gt;= '00001' AND
  PFUNC.CHAPA &lt;= '00010'
  </Filter>
          <TableName>PFUNC</TableName>
        </RptFilterByTablePar>
      </FiltersByTable>
      <MainFilter>true</MainFilter>
      <Value>(PFUNC.CHAPA &gt;= '00001' AND
  PFUNC.CHAPA &lt;= '00010')</Value>
    </RptFilterReportPar>
  </ArrayOfRptFilterReportPar>]]></tot:filters>
           <!--Optional:-->
           <tot:parameters><![CDATA[<?xml version="1.0" encoding="utf-16"?>
  <ArrayOfRptParameterReportPar xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.totvs.com.br/RM/">
    {parameters}
  </ArrayOfRptParameterReportPar>]]></tot:parameters>
           <!--Optional:-->
           <tot:fileName>Report{ id_report }.pdf</tot:fileName>
           <!--Optional:-->
           <tot:contexto>CodColigada=1;CodFilial=1</tot:contexto>
        </tot:GenerateReport>
     </soapenv:Body>
  </soapenv:Envelope>
  """
  print(xml_generate)
  return xml_generate


response = generate_report(10, PARAM_COLIGADA='1', PARAM_TESTE='1')