declare module '@mailchimp/mailchimp_marketing' {
  interface Config {
    apiKey?: string
    accessToken?: string
    server?: string
  }

  interface MailchimpClient {
    setConfig(config: Config): void
    lists: {
      addListMember(listId: string, body: any): Promise<any>
      updateListMember(listId: string, subscriberHash: string, body: any): Promise<any>
      getListMember(listId: string, subscriberHash: string): Promise<any>
      createListMemberEvent(listId: string, subscriberHash: string, body: any): Promise<any>
    }
    campaigns: {
      create(body: any): Promise<any>
      setContent(campaignId: string, body: any): Promise<any>
      send(campaignId: string): Promise<any>
    }
  }

  const mailchimp: MailchimpClient
  export default mailchimp
}
