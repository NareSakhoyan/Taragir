"use client"

import Link from "next/link"
import {
  BookMarkedIcon,
  BookOpenTextIcon,
  BookTextIcon,
  Clock3Icon,
  FileSearchIcon,
  FilesIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  SearchIcon,
  TypeIcon,
  UploadCloudIcon,
  type LucideIcon,
} from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"

import { UserMenu } from "@/components/auth/user-menu"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthSession } from "@/lib/hooks/use-auth-session"
import { useI18n } from "@/lib/i18n/use-i18n"
import { ROUTES } from "@/lib/utils/constants"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

type NavGroup = {
  title: string
  items: NavItem[]
}

function NavGroupList({ group }: { group: NavGroup }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { href } = useI18n()
  const hasDiscoveryWorkspaceItem = group.items.some((item) => item.url === `${ROUTES.documents}?workspace=discovery`)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const localizedHref = href(item.url)
            const [localizedPath, localizedQuery = ""] = localizedHref.split("?")
            const itemSearchParams = new URLSearchParams(localizedQuery)
            const workspace = itemSearchParams.get("workspace")
            const documentsPath = href(ROUTES.documents)
            const currentWorkspace = searchParams.get("workspace")
            const isDiscoveryDetail = pathname.startsWith(`${documentsPath}/`) && pathname.endsWith("/discovery")
            const isDocumentsItem = item.url === ROUTES.documents
            const isWorkspaceItem = item.url.startsWith(`${ROUTES.documents}?workspace=`)
            const isActive = workspace
              ? (pathname === localizedPath && currentWorkspace === workspace) ||
                (workspace === "discovery" && isDiscoveryDetail)
              : (pathname === localizedPath || pathname.startsWith(`${localizedPath}/`)) &&
                !(isDocumentsItem && hasDiscoveryWorkspaceItem && (currentWorkspace || isDiscoveryDetail)) &&
                !isWorkspaceItem
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={localizedHref}>
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { href, messages } = useI18n()
  const { isAdmin } = useAuthSession()

  const navGroups: NavGroup[] = isAdmin
    ? [
        {
          title: messages.nav.groups.core,
          items: [
            { title: messages.nav.dashboard, url: ROUTES.dashboard, icon: LayoutDashboardIcon },
            { title: messages.nav.documents, url: ROUTES.documents, icon: FilesIcon },
            { title: messages.nav.words, url: ROUTES.words, icon: TypeIcon },
          ],
        },
        {
          title: messages.nav.groups.references,
          items: [
            { title: messages.nav.references, url: ROUTES.references, icon: BookTextIcon },
            { title: messages.nav.referenceMatching, url: ROUTES.referenceMatching, icon: SearchIcon },
          ],
        },
        {
          title: messages.nav.groups.curation,
          items: [
            { title: messages.nav.lexicon, url: ROUTES.lexicon, icon: LibraryBigIcon },
            { title: messages.nav.lexemes, url: ROUTES.lexemes, icon: BookMarkedIcon },
          ],
        },
        {
          title: messages.nav.groups.system,
          items: [
            { title: messages.nav.jobs, url: ROUTES.jobs, icon: Clock3Icon },
          ],
        },
      ]
    : [
        {
          title: messages.nav.groups.core,
          items: [
            { title: messages.nav.documents, url: ROUTES.documents, icon: FilesIcon },
            { title: "Discovery", url: `${ROUTES.documents}?workspace=discovery`, icon: FileSearchIcon },
            { title: "Upload", url: `${ROUTES.documents}?workspace=upload`, icon: UploadCloudIcon },
          ],
        },
      ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={href(isAdmin ? ROUTES.dashboard : ROUTES.documents)}>
                <BookOpenTextIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Baghramyan OCR</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroupList group={group} key={group.title} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <LocaleSwitcher />
          <UserMenu />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
